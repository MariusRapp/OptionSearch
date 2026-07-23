# OptionSearch — Web-Frontend

Statische Einzelseite (`index.html`) zur Abfrage von Optionsdaten mit
[DuckDB-WASM](https://duckdb.org/docs/api/wasm/overview) direkt im Browser
(HTTP-Range-Requests auf Parquet). Kein Backend.

Die Daten liegen in einem **privaten** Dataset und werden über einen
Auth-Proxy (Cloudflare Worker) ausgeliefert. Ohne gültigen Zugriffs-Schlüssel
zeigt die Seite keine Daten — der Schlüssel wird lokal pro Gerät unter
**„Einstellungen (Datenquelle)"** eingetragen und im `localStorage` gespeichert.

> Dieses Repo enthält **nur** das Frontend. Es liegen hier keine Daten,
> keine Tokens und keine Zugriffsschlüssel.
