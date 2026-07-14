#include <Wire.h>
#include <mpu9250.h>
#include <math.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

bfs::Mpu9250 imu;

// =====================================================
// IDENTIFICACIÓN DEL NODO
// =====================================================
const char SENSOR_ID[] = "MPU_IZQUIERDO";

// =====================================================
// CONFIGURACIÓN WiFi Y BACKEND
// =====================================================
const char* WIFI_SSID = "GRUPO5";
const char* WIFI_PASSWORD = "123456789";
const char* API_URL = "http://hsiatx2025.cloud/api/telemetry";
const char* SENSOR_TIPO = "vibracion";
const char* UNIDAD = "m/s²";
const unsigned long INTERVALO_ENVIO_MS = 1000; // cada 1 segundo

// =====================================================
// CONFIGURACIÓN
// =====================================================
constexpr uint32_t BAUDIOS = 921600;

// fs = 1000 / (SRD + 1)
// SRD = 4 -> 200 Hz
constexpr uint8_t SRD = 4;
constexpr uint16_t FRECUENCIA_HZ = 200;

// Calibración de 1000 muestras = aproximadamente 5 s a 200 Hz
constexpr uint16_t MUESTRAS_CALIBRACION = 1000;

// Tiempo para medir ruido de máquina y ambiente.
// Para una prueba rápida: 15 o 30 s.
// Para ensayo definitivo: 60 a 120 s.
constexpr uint16_t SEGUNDOS_RUIDO = 30;
constexpr uint32_t MUESTRAS_RUIDO =
    static_cast<uint32_t>(FRECUENCIA_HZ) * SEGUNDOS_RUIDO;

// Umbral solamente informativo.
// No elimina ni recorta las mediciones.
constexpr float FACTOR_SIGMA = 3.0f;

// =====================================================
// OFFSETS EN REPOSO
// Incluyen sesgo del sensor y proyección inicial de gravedad
// =====================================================
float offsetAx = 0.0f;
float offsetAy = 0.0f;
float offsetAz = 0.0f;

float offsetGx = 0.0f;
float offsetGy = 0.0f;
float offsetGz = 0.0f;

// Eje más alineado con la gravedad
char ejeVertical = '?';
float signoVertical = 1.0f;

// =====================================================
// ESTADÍSTICAS DEL RUIDO DE FONDO
// =====================================================
struct Estadistica {
  uint32_t n = 0;
  double media = 0.0;
  double m2 = 0.0;

  void agregar(double valor) {
    n++;
    const double delta = valor - media;
    media += delta / n;
    const double delta2 = valor - media;
    m2 += delta * delta2;
  }

  double desviacion() const {
    if (n < 2) {
      return 0.0;
    }
    return sqrt(m2 / (n - 1));
  }
};

Estadistica ruidoAx;
Estadistica ruidoAy;
Estadistica ruidoAz;

Estadistica ruidoGx;
Estadistica ruidoGy;
Estadistica ruidoGz;

// =====================================================
// TIEMPO
// =====================================================
uint32_t tiempoInicio_us = 0;
uint32_t tiempoAnterior_us = 0;

// =====================================================
// OBTENER ACELERACIÓN DEL EJE VERTICAL
// =====================================================
float obtenerVertical(float x, float y, float z) {
  if (ejeVertical == 'X') {
    return signoVertical * x;
  }

  if (ejeVertical == 'Y') {
    return signoVertical * y;
  }

  return signoVertical * z;
}

// =====================================================
// CALIBRACIÓN AUTOMÁTICA EN REPOSO
// =====================================================
void calibrarSensor() {
  double sumaAx = 0.0;
  double sumaAy = 0.0;
  double sumaAz = 0.0;

  double sumaGx = 0.0;
  double sumaGy = 0.0;
  double sumaGz = 0.0;

  uint16_t contador = 0;

  Serial.println("#");
  Serial.println("# =======================================");
  Serial.println("# CALIBRACION AUTOMATICA");
  Serial.println("# No mover la viga ni tocar el sensor");
  Serial.println("# =======================================");

  while (contador < MUESTRAS_CALIBRACION) {
    if (imu.Read()) {
      sumaAx += imu.accel_x_mps2();
      sumaAy += imu.accel_y_mps2();
      sumaAz += imu.accel_z_mps2();

      sumaGx += imu.gyro_x_radps();
      sumaGy += imu.gyro_y_radps();
      sumaGz += imu.gyro_z_radps();

      contador++;
    } else {
      delay(1);
    }
  }

  offsetAx = sumaAx / MUESTRAS_CALIBRACION;
  offsetAy = sumaAy / MUESTRAS_CALIBRACION;
  offsetAz = sumaAz / MUESTRAS_CALIBRACION;

  offsetGx = sumaGx / MUESTRAS_CALIBRACION;
  offsetGy = sumaGy / MUESTRAS_CALIBRACION;
  offsetGz = sumaGz / MUESTRAS_CALIBRACION;

  // Identificar el eje con mayor proyección de gravedad
  float mayor = fabs(offsetAx);
  ejeVertical = 'X';
  signoVertical = offsetAx >= 0.0f ? 1.0f : -1.0f;

  if (fabs(offsetAy) > mayor) {
    mayor = fabs(offsetAy);
    ejeVertical = 'Y';
    signoVertical = offsetAy >= 0.0f ? 1.0f : -1.0f;
  }

  if (fabs(offsetAz) > mayor) {
    ejeVertical = 'Z';
    signoVertical = offsetAz >= 0.0f ? 1.0f : -1.0f;
  }

  Serial.print("# Offset Ax = ");
  Serial.println(offsetAx, 6);

  Serial.print("# Offset Ay = ");
  Serial.println(offsetAy, 6);

  Serial.print("# Offset Az = ");
  Serial.println(offsetAz, 6);

  Serial.print("# Offset Gx = ");
  Serial.println(offsetGx, 6);

  Serial.print("# Offset Gy = ");
  Serial.println(offsetGy, 6);

  Serial.print("# Offset Gz = ");
  Serial.println(offsetGz, 6);

  Serial.print("# Eje vertical detectado = ");
  Serial.println(ejeVertical);

  Serial.print("# Signo inicial de gravedad = ");
  Serial.println(signoVertical > 0.0f ? "+" : "-");

  Serial.println("# Calibracion terminada");
}

// =====================================================
// MEDICIÓN DEL RUIDO BASE
// Máquina y equipos encendidos, pero sin variar la carga
// =====================================================
void medirRuidoBase() {
  Serial.println("#");
  Serial.println("# =======================================");
  Serial.println("# MEDICION DEL RUIDO DE FONDO");
  Serial.println("# Mantener la viga sin carga variable");
  Serial.print("# Duracion aproximada = ");
  Serial.print(SEGUNDOS_RUIDO);
  Serial.println(" segundos");
  Serial.println("# =======================================");

  uint32_t contador = 0;

  while (contador < MUESTRAS_RUIDO) {
    if (imu.Read()) {
      const float adx = imu.accel_x_mps2() - offsetAx;
      const float ady = imu.accel_y_mps2() - offsetAy;
      const float adz = imu.accel_z_mps2() - offsetAz;

      const float gx = imu.gyro_x_radps() - offsetGx;
      const float gy = imu.gyro_y_radps() - offsetGy;
      const float gz = imu.gyro_z_radps() - offsetGz;

      ruidoAx.agregar(adx);
      ruidoAy.agregar(ady);
      ruidoAz.agregar(adz);

      ruidoGx.agregar(gx);
      ruidoGy.agregar(gy);
      ruidoGz.agregar(gz);

      contador++;
    } else {
      delay(1);
    }
  }

  Serial.println("# Ruido base calculado:");

  Serial.print("# Sigma Ax = ");
  Serial.println(ruidoAx.desviacion(), 6);

  Serial.print("# Sigma Ay = ");
  Serial.println(ruidoAy.desviacion(), 6);

  Serial.print("# Sigma Az = ");
  Serial.println(ruidoAz.desviacion(), 6);

  Serial.print("# Sigma Gx = ");
  Serial.println(ruidoGx.desviacion(), 6);

  Serial.print("# Sigma Gy = ");
  Serial.println(ruidoGy.desviacion(), 6);

  Serial.print("# Sigma Gz = ");
  Serial.println(ruidoGz.desviacion(), 6);

  Serial.println("# Medicion de ruido terminada");
}

// ------------------------------------------------------
// Enviar todos los parámetros al backend vía HTTP POST
// ------------------------------------------------------
void enviarLectura(
  float aceleracion, float ax, float ay, float az,
  float adx, float ady, float adz,
  float gx, float gy, float gz,
  float temperatura, bool evento
) {

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("# WiFi desconectado, no se envia dato");
    return;
  }

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<512> doc;
  doc["sensor_id"] = SENSOR_ID;
  doc["sensor_tipo"] = SENSOR_TIPO;
  doc["valor"] = round(aceleracion * 1000.0) / 1000.0;
  doc["unidad"] = UNIDAD;

  doc["ax"] = round(ax * 10000.0) / 10000.0;
  doc["ay"] = round(ay * 10000.0) / 10000.0;
  doc["az"] = round(az * 10000.0) / 10000.0;

  doc["adx"] = round(adx * 10000.0) / 10000.0;
  doc["ady"] = round(ady * 10000.0) / 10000.0;
  doc["adz"] = round(adz * 10000.0) / 10000.0;

  doc["aver"] = round(aceleracion * 10000.0) / 10000.0;

  doc["gx"] = round(gx * 100000.0) / 100000.0;
  doc["gy"] = round(gy * 100000.0) / 100000.0;
  doc["gz"] = round(gz * 100000.0) / 100000.0;

  doc["temp"] = round(temperatura * 100.0) / 100.0;
  doc["evento"] = evento ? 1 : 0;

  String body;
  serializeJson(doc, body);

  int codigo = http.POST(body);

  if (codigo == 200 || codigo == 201) {
    Serial.print("# OK enviado: ");
    Serial.println(body);
  } else {
    Serial.print("# ERROR HTTP ");
    Serial.print(codigo);
    Serial.print(": ");
    Serial.println(body);
  }

  http.end();
}

// =====================================================
// SETUP
// =====================================================
void setup() {
  Serial.begin(BAUDIOS);
  delay(2000);

  Serial.println();
  Serial.println("# =======================================");
  Serial.println("# MPU9250 - ENSAYO DE FLEXION");
  Serial.print("# Sensor = ");
  Serial.println(SENSOR_ID);
  Serial.println("# =======================================");

  // ── Conexión WiFi ──
  Serial.print("# Conectando a WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long inicioWiFi = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (millis() - inicioWiFi > 15000) {
      Serial.println();
      Serial.println("# ERROR: no se pudo conectar a WiFi");
      break;
    }
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("# WiFi conectado. IP: ");
    Serial.println(WiFi.localIP());
  }

  Wire.begin(21, 22);
  Wire.setClock(400000);

  imu.Config(&Wire, bfs::Mpu9250::I2C_ADDR_PRIM);

  if (!imu.Begin()) {
    Serial.println("# ERROR: no se pudo iniciar el MPU9250");
    while (true) {
      delay(1000);
    }
  }

  Serial.println("# MPU9250 iniciado correctamente");

  // ±4 g: mejor resolución que ±16 g y margen suficiente
  // para una primera prueba. Cambiar a ±8 g si se satura.
  if (!imu.ConfigAccelRange(
          bfs::Mpu9250::ACCEL_RANGE_4G)) {
    Serial.println("# ERROR configurando acelerometro");
    while (true) {
      delay(1000);
    }
  }

  // ±250 grados/s: mayor sensibilidad para giros pequeños
  if (!imu.ConfigGyroRange(
          bfs::Mpu9250::GYRO_RANGE_250DPS)) {
    Serial.println("# ERROR configurando giroscopio");
    while (true) {
      delay(1000);
    }
  }

  // Filtro pasabajos inicial de 92 Hz.
  // Posteriormente se ajustará según el espectro observado.
  if (!imu.ConfigDlpfBandwidth(
          bfs::Mpu9250::DLPF_BANDWIDTH_92HZ)) {
    Serial.println("# ERROR configurando DLPF");
    while (true) {
      delay(1000);
    }
  }

  if (!imu.ConfigSrd(SRD)) {
    Serial.println("# ERROR configurando frecuencia");
    while (true) {
      delay(1000);
    }
  }

  Serial.print("# Frecuencia nominal = ");
  Serial.print(FRECUENCIA_HZ);
  Serial.println(" Hz");

  Serial.println("# Espera inicial: 5 segundos");
  Serial.println("# No mover sensor ni viga");
  delay(5000);

  calibrarSensor();
  medirRuidoBase();

  Serial.println("#");
  Serial.println("# INICIANDO ADQUISICION");
  Serial.println(
    "sensor,t_us,dt_us,Ax,Ay,Az,"
    "Adx,Ady,Adz,Avertical,"
    "Gx,Gy,Gz,Temp,evento"
  );

  tiempoInicio_us = micros();
  tiempoAnterior_us = tiempoInicio_us;
}

// =====================================================
// LOOP
// =====================================================
void loop() {
  if (!imu.Read()) {
    return;
  }

  const uint32_t tiempoActual_us = micros();
  const uint32_t tiempo_us =
      tiempoActual_us - tiempoInicio_us;
  const uint32_t dt_us =
      tiempoActual_us - tiempoAnterior_us;

  tiempoAnterior_us = tiempoActual_us;

  // Lecturas originales
  const float Ax = imu.accel_x_mps2();
  const float Ay = imu.accel_y_mps2();
  const float Az = imu.accel_z_mps2();

  // Eliminar gravedad inicial y offset estático
  float Adx = Ax - offsetAx;
  float Ady = Ay - offsetAy;
  float Adz = Az - offsetAz;

  // Eliminar únicamente la media residual del ruido base.
  // No se elimina el ruido aleatorio muestra por muestra.
  Adx -= static_cast<float>(ruidoAx.media);
  Ady -= static_cast<float>(ruidoAy.media);
  Adz -= static_cast<float>(ruidoAz.media);

  // Giroscopio corregido
  float Gx = imu.gyro_x_radps() - offsetGx;
  float Gy = imu.gyro_y_radps() - offsetGy;
  float Gz = imu.gyro_z_radps() - offsetGz;

  Gx -= static_cast<float>(ruidoGx.media);
  Gy -= static_cast<float>(ruidoGy.media);
  Gz -= static_cast<float>(ruidoGz.media);

  const float temperatura = imu.die_temp_c();

  // Aceleración principal perpendicular a la viga
  const float aceleracionVertical =
      obtenerVertical(Adx, Ady, Adz);

  double sigmaVertical = ruidoAz.desviacion();

  if (ejeVertical == 'X') {
    sigmaVertical = ruidoAx.desviacion();
  } else if (ejeVertical == 'Y') {
    sigmaVertical = ruidoAy.desviacion();
  }

  // Indicador de que la señal supera 3 veces el ruido base
  const bool evento =
      fabs(aceleracionVertical) >
      FACTOR_SIGMA * sigmaVertical;

  // Salida CSV
  Serial.print(SENSOR_ID);
  Serial.print(",");

  Serial.print(tiempo_us);
  Serial.print(",");

  Serial.print(dt_us);
  Serial.print(",");

  Serial.print(Ax, 5);
  Serial.print(",");

  Serial.print(Ay, 5);
  Serial.print(",");

  Serial.print(Az, 5);
  Serial.print(",");

  Serial.print(Adx, 5);
  Serial.print(",");

  Serial.print(Ady, 5);
  Serial.print(",");

  Serial.print(Adz, 5);
  Serial.print(",");

  Serial.print(aceleracionVertical, 5);
  Serial.print(",");

  Serial.print(Gx, 6);
  Serial.print(",");

  Serial.print(Gy, 6);
  Serial.print(",");

  Serial.print(Gz, 6);
  Serial.print(",");

  Serial.print(temperatura, 2);
  Serial.print(",");

  Serial.println(evento ? 1 : 0);

  // ── Envío periódico al backend ──
  static unsigned long ultimoEnvio = 0;
  unsigned long ahora = millis();
  if (ahora - ultimoEnvio >= INTERVALO_ENVIO_MS) {
    ultimoEnvio = ahora;
    enviarLectura(
      aceleracionVertical,
      Ax, Ay, Az,
      Adx, Ady, Adz,
      Gx, Gy, Gz,
      temperatura, evento
    );
  }
}
