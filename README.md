# Simulador de Hipoteca

Simulador de hipoteca para el mercado español con sistema de amortización francesa. Funciona como página web estática (HTML + CSS + JS puro), sin dependencias de servidor.

## Características

- **Cuadro de amortización** con gráfico interactivo (capital vs. intereses mes a mes), usando fechas reales en el eje X a partir del mes de inicio del préstamo.
- **Amortizaciones extraordinarias** dinámicas: añade una o varias indicando fecha (mes, año y día opcional) e importe. Calcula el ahorro en intereses y la reducción de plazo, eligiendo entre reducir cuota o reducir plazo.
- **Capital restante hoy**: calcula automáticamente el saldo pendiente a fecha actual, teniendo en cuenta las amortizaciones extraordinarias ya realizadas.
- **Persistencia**: los datos del formulario se guardan automáticamente en `localStorage` y se restauran al recargar la página.
- **Exportar / Importar**: guarda la configuración actual en un archivo JSON y recupérala en cualquier momento.

## Uso

Al ser una web estática con módulos ES, necesita servirse sobre HTTP (no funciona directamente desde `file://`):

```bash
python3 -m http.server 8080
# Abre http://localhost:8080
```

O usa la extensión **Live Server** de VS Code.

## Tecnología

- **Desarrollado mayormente con Copilot + Claude Sonnet 4.6**
- HTML5 · CSS3 · JavaScript (ES Modules)
- [Chart.js 4](https://www.chartjs.org/) vía CDN (gráfico de amortización)

## Licencia

MIT © 2026 Pablo García
