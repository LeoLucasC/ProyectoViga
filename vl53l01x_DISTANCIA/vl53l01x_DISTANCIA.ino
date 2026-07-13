#include <Wire.h>
#include <Adafruit_VL53L1X.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ======================================================
// CONFIGURACIÓN WiFi
// ======================================================

const char* WIFI_SSID = "LEOYJHON";
const char* WIFI_PASSWORD = "1371928L";

// ======================================================
// CONFIGURACIÓN DEL BACKEND
// ======================================================

const char* API_URL = "http://hsiatx2025.cloud/api/telemetry";
const char* SENSOR_ID = "bridge-01";
const char* SENSOR_TIPO = "distancia";
const char* UNIDAD = "mm";

// Intervalo de envío al backend
const unsigned long INTERVALO_ENVIO_MS = 2000; // cada 2 segundos

Adafruit_VL53L1X vl53 = Adafruit_VL53L1X();

const int PIN_SDA = 21;
const int PIN_SCL = 22;

const uint16_t TIMING_BUDGET_MS = 100;

// Tiempo de estabilización inicial
const unsigned long TIEMPO_ESTABILIZACION_MS = 5000;

// Tiempo para calcular la distancia inicial
const unsigned long TIEMPO_REFERENCIA_MS = 30000;

// Rango válido de trabajo
const int DISTANCIA_MINIMA_MM = 40;
const int DISTANCIA_MAXIMA_MM = 1000;

// ======================================================
// ECUACIÓN DE CALIBRACIÓN
// d_real = CAL_A * d_sensor + CAL_B
// ======================================================

const float CAL_A = 1.161587f;
const float CAL_B = 3.317003f;

// ======================================================
// FILTRO DE MEDIANA
// ======================================================

const int TAMANO_VENTANA = 5;

float ventana[TAMANO_VENTANA];
int posicionVentana = 0;
int elementosVentana = 0;

// ======================================================
// VARIABLES DE REFERENCIA
// ======================================================

float referenciaSensor = 0.0f;
float referenciaCorregida = 0.0f;

unsigned long tiempoInicioAdquisicion = 0;
unsigned long tiempoAnteriorUs = 0;

// ======================================================
// FUNCIONES
// ======================================================

float corregirDistancia(float distanciaSensor) {
  return CAL_A * distanciaSensor + CAL_B;
}

// ------------------------------------------------------
// Ordenar valores para calcular la mediana
// ------------------------------------------------------

void ordenarArray(float datos[], int cantidad) {
  for (int i = 0; i < cantidad - 1; i++) {
    for (int j = i + 1; j < cantidad; j++) {
      if (datos[j] < datos[i]) {
        float temporal = datos[i];
        datos[i] = datos[j];
        datos[j] = temporal;
      }
    }
  }
}

// ------------------------------------------------------
// Calcular mediana móvil
// ------------------------------------------------------

float calcularMediana(float nuevoValor) {

  ventana[posicionVentana] = nuevoValor;

  posicionVentana++;

  if (posicionVentana >= TAMANO_VENTANA) {
    posicionVentana = 0;
  }

  if (elementosVentana < TAMANO_VENTANA) {
    elementosVentana++;
  }

  float copia[TAMANO_VENTANA];

  for (int i = 0; i < elementosVentana; i++) {
    copia[i] = ventana[i];
  }

  ordenarArray(copia, elementosVentana);

  if (elementosVentana % 2 == 0) {
    int centro = elementosVentana / 2;

    return (copia[centro - 1] + copia[centro]) / 2.0f;
  }

  return copia[elementosVentana / 2];
}

// ------------------------------------------------------
// Verificar que una distancia sea válida
// ------------------------------------------------------

bool distanciaValida(int distanciaMm) {

  if (distanciaMm < DISTANCIA_MINIMA_MM) {
    return false;
  }

  if (distanciaMm > DISTANCIA_MAXIMA_MM) {
    return false;
  }

  return true;
}

// ------------------------------------------------------
// Esperar una medición nueva
// ------------------------------------------------------

bool obtenerDistancia(int16_t& distanciaMm) {

  unsigned long tiempoInicio = millis();

  while (!vl53.dataReady()) {

    if (millis() - tiempoInicio > 1000) {
      return false;
    }

    delay(1);
  }

  distanciaMm = vl53.distance();

  vl53.clearInterrupt();

  return true;
}

// ------------------------------------------------------
// Calcular referencia durante 30 segundos
// ------------------------------------------------------

void calcularReferencia() {

  Serial.println("#");
  Serial.println("# =======================================");
  Serial.println("# MEDICION DE DISTANCIA INICIAL");
  Serial.println("# Mantener el objetivo completamente quieto");
  Serial.println("# Duracion: 30 segundos");
  Serial.println("# =======================================");
  Serial.println("#");

  unsigned long inicioReferencia = millis();

  unsigned long cantidad = 0;

  double media = 0.0;
  double M2 = 0.0;

  float minimo = 1000000.0f;
  float maximo = -1000000.0f;

  while (millis() - inicioReferencia < TIEMPO_REFERENCIA_MS) {

    int16_t distanciaRaw;

    if (!obtenerDistancia(distanciaRaw)) {
      continue;
    }

    if (!distanciaValida(distanciaRaw)) {
      continue;
    }

    cantidad++;

    double valor = (double)distanciaRaw;

    double diferencia = valor - media;

    media += diferencia / cantidad;

    double diferencia2 = valor - media;

    M2 += diferencia * diferencia2;

    if (valor < minimo) {
      minimo = valor;
    }

    if (valor > maximo) {
      maximo = valor;
    }
  }

  if (cantidad == 0) {

    Serial.println("# ERROR: no se obtuvieron lecturas validas.");
    referenciaSensor = 0.0f;
    referenciaCorregida = 0.0f;

    return;
  }

  double varianza = 0.0;

  if (cantidad > 1) {
    varianza = M2 / (cantidad - 1);
  }

  double desviacionEstandar = sqrt(varianza);

  referenciaSensor = (float)media;
  referenciaCorregida = corregirDistancia(referenciaSensor);

  float minimoCorregido = corregirDistancia(minimo);
  float maximoCorregido = corregirDistancia(maximo);

  Serial.println("# RESULTADOS DE REFERENCIA");

  Serial.print("# Distancia promedio sin corregir = ");
  Serial.print(referenciaSensor, 3);
  Serial.println(" mm");

  Serial.print("# Distancia promedio corregida = ");
  Serial.print(referenciaCorregida, 3);
  Serial.println(" mm");

  Serial.print("# Desviacion estandar sin corregir = ");
  Serial.print(desviacionEstandar, 3);
  Serial.println(" mm");

  Serial.print("# Desviacion estandar corregida aproximada = ");
  Serial.print(desviacionEstandar * CAL_A, 3);
  Serial.println(" mm");

  Serial.print("# Distancia minima sin corregir = ");
  Serial.print(minimo, 0);
  Serial.println(" mm");

  Serial.print("# Distancia minima corregida = ");
  Serial.print(minimoCorregido, 3);
  Serial.println(" mm");

  Serial.print("# Distancia maxima sin corregir = ");
  Serial.print(maximo, 0);
  Serial.println(" mm");

  Serial.print("# Distancia maxima corregida = ");
  Serial.print(maximoCorregido, 3);
  Serial.println(" mm");

  Serial.print("# Pico a pico sin corregir = ");
  Serial.print(maximo - minimo, 0);
  Serial.println(" mm");

  Serial.print("# Pico a pico corregido = ");
  Serial.print((maximo - minimo) * CAL_A, 3);
  Serial.println(" mm");

  Serial.print("# Lecturas validas = ");
  Serial.println(cantidad);

  Serial.println("# Medicion de referencia terminada");
}

// ======================================================
// SETUP
// ======================================================

// ------------------------------------------------------
// Enviar deflexión al backend vía HTTP
// ------------------------------------------------------

void enviarDeflexion(float deflexion) {

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("# WiFi desconectado, no se envia dato");
    return;
  }

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["sensor_id"] = SENSOR_ID;
  doc["sensor_tipo"] = SENSOR_TIPO;
  doc["valor"] = round(deflexion * 100.0) / 100.0;
  doc["unidad"] = UNIDAD;

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

// ======================================================
// SETUP
// ======================================================

void setup() {

  Serial.begin(115200);

  delay(1500);

  Serial.println();
  Serial.println("# =======================================");
  Serial.println("# VL53L1X - MEDICION DE DEFLEXION");
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

  Wire.begin(PIN_SDA, PIN_SCL);
  Wire.setClock(400000);

  if (!vl53.begin(0x29, &Wire)) {

    Serial.println("# ERROR: no se encontro el VL53L1X.");

    while (true) {
      delay(1000);
    }
  }

  Serial.println("# VL53L1X iniciado correctamente");

  Serial.print("# Sensor ID = 0x");
  Serial.println(vl53.sensorID(), HEX);

  if (!vl53.startRanging()) {

    Serial.println("# ERROR: no se pudo iniciar la medicion.");

    while (true) {
      delay(1000);
    }
  }

  vl53.setTimingBudget(TIMING_BUDGET_MS);

  Serial.print("# Timing budget = ");
  Serial.print(TIMING_BUDGET_MS);
  Serial.println(" ms");

  Serial.print("# Frecuencia aproximada = ");
  Serial.print(1000.0f / TIMING_BUDGET_MS, 1);
  Serial.println(" Hz");

  Serial.println("#");
  Serial.println("# ECUACION DE CALIBRACION");
  Serial.println("# d_corregida = 1.161587*d_sensor + 3.317003");

  Serial.println("#");
  Serial.println("# =======================================");
  Serial.println("# ESTABILIZACION INICIAL");
  Serial.println("# No mover sensor ni objetivo");
  Serial.println("# Duracion aproximada: 5 segundos");
  Serial.println("# =======================================");

  delay(TIEMPO_ESTABILIZACION_MS);

  Serial.println("# Estabilizacion terminada");

  calcularReferencia();

  // Reiniciar filtro de mediana
  posicionVentana = 0;
  elementosVentana = 0;

  Serial.println("#");
  Serial.println("# INICIANDO ADQUISICION");

  Serial.println(
    "sensor,"
    "tiempo_s,"
    "t_us,"
    "dt_s,"
    "dt_us,"
    "distancia_raw_mm,"
    "distancia_corregida_mm,"
    "distancia_mediana_raw_mm,"
    "distancia_mediana_corregida_mm,"
    "deflexion_raw_mm,"
    "deflexion_filtrada_mm,"
    "valida"
  );

  tiempoInicioAdquisicion = micros();
  tiempoAnteriorUs = tiempoInicioAdquisicion;
}

// ======================================================
// LOOP
// ======================================================

void loop() {

  int16_t distanciaRaw;

  bool lecturaDisponible = obtenerDistancia(distanciaRaw);

  unsigned long tiempoActualUs = micros();

  unsigned long tiempoUs =
      tiempoActualUs - tiempoInicioAdquisicion;

  unsigned long dtUs =
      tiempoActualUs - tiempoAnteriorUs;

  tiempoAnteriorUs = tiempoActualUs;

  float tiempoSegundos =
      tiempoUs / 1000000.0f;

  float dtSegundos =
      dtUs / 1000000.0f;

  bool valida =
      lecturaDisponible &&
      distanciaValida(distanciaRaw);

  float distanciaCorregida = NAN;
  float distanciaMedianaRaw = NAN;
  float distanciaMedianaCorregida = NAN;

  float deflexionRaw = NAN;
  float deflexionFiltrada = NAN;

  if (valida) {

    distanciaCorregida =
        corregirDistancia((float)distanciaRaw);

    distanciaMedianaRaw =
        calcularMediana((float)distanciaRaw);

    distanciaMedianaCorregida =
        corregirDistancia(distanciaMedianaRaw);

    /*
       Si la viga baja hacia el sensor,
       la distancia disminuye y la deflexión queda positiva.
    */

    deflexionRaw =
        referenciaCorregida - distanciaCorregida;

    deflexionFiltrada =
        referenciaCorregida -
        distanciaMedianaCorregida;
  }

  // ── Envío periódico al backend ──
  static unsigned long ultimoEnvio = 0;
  unsigned long ahora = millis();
  if (ahora - ultimoEnvio >= INTERVALO_ENVIO_MS) {
    ultimoEnvio = ahora;
    float valorEnviar = NAN;
    // Si calibración falló (referencia = 0), mandar distancia cruda
    if (referenciaCorregida < 0.01f && !isnan(distanciaMedianaCorregida)) {
      valorEnviar = distanciaMedianaCorregida;
    } else if (!isnan(deflexionFiltrada)) {
      valorEnviar = deflexionFiltrada;
    }
    if (!isnan(valorEnviar)) {
      enviarDeflexion(valorEnviar);
    }
  }

  Serial.print(SENSOR_ID);
  Serial.print(",");

  Serial.print(tiempoSegundos, 3);
  Serial.print(",");

  Serial.print(tiempoUs);
  Serial.print(",");

  Serial.print(dtSegundos, 4);
  Serial.print(",");

  Serial.print(dtUs);
  Serial.print(",");

  if (valida) {

    Serial.print(distanciaRaw);
    Serial.print(",");

    Serial.print(distanciaCorregida, 3);
    Serial.print(",");

    Serial.print(distanciaMedianaRaw, 3);
    Serial.print(",");

    Serial.print(distanciaMedianaCorregida, 3);
    Serial.print(",");

    Serial.print(deflexionRaw, 3);
    Serial.print(",");

    Serial.print(deflexionFiltrada, 3);
    Serial.print(",");

    Serial.println(1);

  } else {

    Serial.print("nan,nan,nan,nan,nan,nan,");
    Serial.println(0);
  }
}