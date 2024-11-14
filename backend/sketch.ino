#include <UIPEthernet.h>
#include <LiquidCrystal.h>

#define RELE_RUA 18
#define RELE_GERADOR 19
#define RELE_COMBUSTIVEL 16
#define RELE_PARTIDA 17
#define MONITOR_RUA 14
#define MONITOR_GERADOR 15
#define BOTAO_MODO 2
#define BOTAO_RELE_RUA 3
#define BOTAO_RELE_GERADOR 4
#define BOTAO_COMANDO_PARTIDA 5

// Inicialização do LCD
const int PIN_LCD_RS = 23;
const int PIN_LCD_ENABLE = 25;
const int PIN_LCD_D4 = 27;
const int PIN_LCD_D5 = 29;
const int PIN_LCD_D6 = 31;
const int PIN_LCD_D7 = 33;
LiquidCrystal lcd(PIN_LCD_RS, PIN_LCD_ENABLE, PIN_LCD_D4, PIN_LCD_D5, PIN_LCD_D6, PIN_LCD_D7);

// Endereço MAC do Arduino na rede
byte mac[] = { 0xC0, 0xA8, 0x01, 0x65, 0x01, 0x01 };

// IP fornecido pelo unibave
byte ip[] = { 192, 168, 1, 103 }; 

// Configuração do servidor na porta HTTP 80
EthernetServer server(80);

bool pulsoModoManual = false;
bool pulsoContatorRua = false;
bool pulsoContatorGerador = false;
bool pulsoPartidaGerador = false;

unsigned long millisLiberacaoCombustivel = 0;
unsigned long millisInicioPartida = 0;
unsigned long millisEsperaEntrePartida = 0;
bool combustivelLiberado = false;
bool partidaLigada = false;
bool geradorLigado = false;
int tentativasPartida = 0;

void setup() {

  Serial.begin(9600);
  lcd.begin(16, 2);          // Inicialização do LCD
  // Inicializa a Ethernet e solicita IP via DHCP
  Serial.println("Iniciando Ethernet com ip 172.16.2.12");
  Ethernet.begin( ip);

  IPAddress ip = Ethernet.localIP(); // Armazena o IP
  Serial.println("IP: " + String(ip[0]) + "." + String(ip[1]) + "." + String(ip[2]) + "." + String(ip[3]));
  
  // Inicia o servidor web
  server.begin();

  // put your setup code here, to run once:
  pinMode(RELE_RUA, OUTPUT);
  pinMode(RELE_GERADOR, OUTPUT);
  pinMode(RELE_COMBUSTIVEL, OUTPUT);
  pinMode(RELE_PARTIDA, OUTPUT);
  pinMode(MONITOR_RUA, INPUT);
  pinMode(MONITOR_GERADOR, INPUT);
  pinMode(BOTAO_MODO, INPUT);
  pinMode(BOTAO_RELE_RUA, INPUT);
  pinMode(BOTAO_RELE_GERADOR, INPUT);
  pinMode(BOTAO_COMANDO_PARTIDA, INPUT);
}

void loop() {
  unsigned long agora = millis();

  if (digitalRead(BOTAO_MODO)) {
    pulsoModoManual = !pulsoModoManual;
  }
  if (digitalRead(BOTAO_RELE_RUA)) {
    pulsoContatorRua = !pulsoContatorRua;
  }
  if (digitalRead(BOTAO_RELE_GERADOR)) {
    pulsoContatorGerador = !pulsoContatorGerador;
  }
  if (digitalRead(BOTAO_COMANDO_PARTIDA)) {
    pulsoPartidaGerador = !pulsoPartidaGerador;
  }

  EthernetClient cliente = server.available();
  if (cliente) {
    Serial.println("cliente conectado");

    // Variáveis para processar a requisição HTTP
    boolean linhaAtualEstaVazia = true;
    String requisicao = "";

    while (cliente.connected()) {
      if (cliente.available()) {
        char c = cliente.read();
        requisicao += c;

        // Se a linha estiver em branco, a requisição foi completamente recebida
        if (c == '\n' && linhaAtualEstaVazia) {
          // Responder às requisições "OPTIONS" para CORS pré-flight
          if (requisicao.indexOf("OPTIONS") != -1) {
            cliente.println("HTTP/1.1 204 No Content");
            cliente.println("Access-Control-Allow-Origin: *");  // Permitir qualquer origem
            cliente.println("Access-Control-Allow-Methods: GET, POST, OPTIONS");
            cliente.println("Access-Control-Allow-Headers: Content-Type");
            cliente.println("Connection: close");
            cliente.println();
            break;
          }

          // Enviar o cabeçalho CORS para todas as respostas HTTP
          cliente.println("HTTP/1.1 200 OK");
          cliente.println("Access-Control-Allow-Origin: *");  // Habilitar CORS para qualquer origem
          cliente.println("Content-Type: text/plain");
          cliente.println("Connection: close");
          cliente.println();

          // Analisa o pedido do cliente
          if (requisicao.indexOf("POST /modo") != -1) {
            pulsoModoManual = !pulsoModoManual;
            Serial.println("Recebido comando de mudança de modo");
          } else if (requisicao.indexOf("POST /contatorua") != -1) {
            pulsoContatorRua = !pulsoContatorRua;
            Serial.println("Recebido comando do contator rua");
          } else if (requisicao.indexOf("POST /contatogerador") != -1) {
            pulsoContatorGerador = !pulsoContatorGerador;
            Serial.println("Recebido comando do contator gerador");
          } else if (requisicao.indexOf("POST /partidagerador") != -1) {
            pulsoPartidaGerador = !pulsoPartidaGerador;
            Serial.println("Recebido comando de partida do gerador");
          } else if (requisicao.indexOf("GET /status") != -1) {
            
            int modo = pulsoModoManual;
            int estadoRua = digitalRead(MONITOR_RUA);
            int estadoGerador = digitalRead(MONITOR_GERADOR);
            int releRua = digitalRead(RELE_RUA);
            int releGerador = digitalRead(RELE_GERADOR);

            cliente.println("{ \"modo\": " + String(modo) + ", \"rua\": " + String(estadoRua) + ", \"gerador\": " + String(estadoGerador) + ", \"releRua\": " + String(releRua) + ", \"releGerador\": " + String(releGerador) + "}");
          } else {
            cliente.println("Comando não reconhecido.");
          }
          break;
        }

        // Verifica se é o final de uma linha HTTP
        if (c == '\n') {
          linhaAtualEstaVazia = true;
        } else if (c != '\r') {
          linhaAtualEstaVazia = false;
        }
      }
    }

    // Fecha a conexão com o cliente
    cliente.stop();
    Serial.println("cliente desconectado");
  }

  String strModo = pulsoModoManual ? "MANUAL" : "AUTOMATICO";
  String line1 = "Modo: " + strModo;

  int valMonitorRua = digitalRead(MONITOR_RUA);
  int valMonitorGerador = digitalRead(MONITOR_GERADOR);
  String strRua = valMonitorRua ? "Lig" : "Desl";
  String strGerador = valMonitorGerador ? "Lig" : "Desl";
  String line2 = "Rua " + strRua + " " + "Ger " + strGerador;

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1);
  lcd.setCursor(0, 1);
  lcd.print(line2);

  // MODO MANUAL
  if (pulsoModoManual) {
    Serial.println("MODO MANUAL");
    // Só lê os estados dos três botões
    int valBotaoRua = pulsoContatorRua;
    int valBotaoGerador = pulsoContatorGerador;
    int valBotaoComandoPartida = pulsoPartidaGerador;
    int valMonitorRua = digitalRead(MONITOR_RUA);
    int valMonitorGerador = digitalRead(MONITOR_GERADOR);

    if (valMonitorGerador) {
      geradorLigado = true;
    } else {
      geradorLigado = false;
    }

    // Aciona os relês de acordo com o estado dos botões
    digitalWrite(RELE_RUA, valBotaoRua);
    digitalWrite(RELE_GERADOR, valBotaoGerador);

    // Só vai passar se o botão da partida estiver ligado
    if (valBotaoComandoPartida) {
      if (!combustivelLiberado) {
        millisLiberacaoCombustivel = agora; // Atualiza o valor assim que o botão é pressionado
        digitalWrite(RELE_COMBUSTIVEL, HIGH);
        combustivelLiberado = true; // Depois, atualiza o estado
      }

      if (geradorLigado) {
        digitalWrite(RELE_PARTIDA, LOW);
        partidaLigada = false;
      } else {
        if (tentativasPartida < 3) {
          if (!partidaLigada) {
            if ((agora - millisLiberacaoCombustivel) > 1000 && (tentativasPartida == 0 || (agora - millisEsperaEntrePartida) > 10000)) {
              millisInicioPartida = agora;
              digitalWrite(RELE_PARTIDA, HIGH);
              partidaLigada = true;
            }
          } else {
            // Mantém a partida ligada durante 3 segundos e desliga após
            if ((agora - millisInicioPartida) > 3000) {
              digitalWrite(RELE_PARTIDA, LOW);
              partidaLigada = false;
              millisEsperaEntrePartida = agora;
              tentativasPartida++;
            }
          }
        }
      }
      // Espera um segundo depois da liberação de combustível antes de dar a partida
    } else { // Caso o botão seja desligado, resetar os parâmetros e desliga os relês
      millisLiberacaoCombustivel = 0;
      millisInicioPartida = 0;
      digitalWrite(RELE_COMBUSTIVEL, LOW);
      digitalWrite(RELE_PARTIDA, LOW);
      combustivelLiberado = false;
      partidaLigada = false;
      tentativasPartida = 0;
    }
  } else { // MODO AUTOMATICO
    Serial.println("MODO AUTOMATICO");
    static bool ruaEstavel = true;
    static unsigned long millisUltimaQuedaEnergia = 0;
    int valMonitorRua = digitalRead(MONITOR_RUA);
    int valMonitorGerador = digitalRead(MONITOR_GERADOR);

    if (valMonitorGerador) {
      geradorLigado = true;
    } else {
      geradorLigado = false;
    }

    if (valMonitorRua) {
      if (ruaEstavel) {
        chavearParaRua(agora);
        digitalWrite(RELE_COMBUSTIVEL, LOW);
        digitalWrite(RELE_PARTIDA, LOW);
        combustivelLiberado = false;
        partidaLigada = false;
        tentativasPartida = 0;
      } else {
        if ((agora - millisUltimaQuedaEnergia) > 5000) {
          ruaEstavel = true;
        }
      }
      // Garante que a partida seja desligada após os três segundos caso a rua volte
      if ((agora - millisInicioPartida) > 3000) {
        digitalWrite(RELE_PARTIDA, LOW);
        partidaLigada = false;
      }
    } else {
      ruaEstavel = false;
      millisUltimaQuedaEnergia = agora;
      digitalWrite(RELE_RUA, LOW);

      // O combustivelLiberado serve pra garantir que o gerador não esteja sendo ligado por um fantasma
      if (geradorLigado && combustivelLiberado) {
        chavearParaGerador(agora);
        digitalWrite(RELE_PARTIDA, LOW);
        partidaLigada = false;
        tentativasPartida = 0;
      } else {

        if (!combustivelLiberado) {
          millisLiberacaoCombustivel = agora; // Atualiza o valor assim que o botão é pressionado
          digitalWrite(RELE_COMBUSTIVEL, HIGH);
          combustivelLiberado = true; // Depois, atualiza o estado
        }

        if (tentativasPartida < 3) {
          if (!partidaLigada) {
            if ((agora - millisLiberacaoCombustivel) > 1000 && (tentativasPartida == 0 || (agora - millisEsperaEntrePartida) > 10000)) {
              millisInicioPartida = agora;
              digitalWrite(RELE_PARTIDA, HIGH);
              partidaLigada = true;
            }
          } else {
            // Mantém a partida ligada durante 3 segundos e desliga após
            if ((agora - millisInicioPartida) > 3000) {
              digitalWrite(RELE_PARTIDA, LOW);
              partidaLigada = false;
              millisEsperaEntrePartida = agora;
              tentativasPartida++;
            }
          }
        }
      }
    }
  }
  delay(500);
}

void chavearParaRua(unsigned long millisAgora) {

  static unsigned long millisGeradorDesligado = millis();
  digitalWrite(RELE_GERADOR, LOW);

  if ((millisAgora - millisGeradorDesligado) > 500) {
    digitalWrite(RELE_RUA, HIGH);
  }
}

void chavearParaGerador(unsigned long millisAgora) {

  static unsigned long millisRuaDesligado = millis();
  digitalWrite(RELE_RUA, LOW);

  if ((millisAgora - millisRuaDesligado) > 500) {
    digitalWrite(RELE_GERADOR, HIGH);
  }
}