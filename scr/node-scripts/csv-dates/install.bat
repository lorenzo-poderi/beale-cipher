rem mkdir csv-dates
rem cd csv-dates
rem PER VERIFICARE CHE FUNZIONI NPM: -> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
npm init -y
npm install csv-parse csv-stringify
rem ha funzionato solo cosi:
rem npm install --save csv-parse
rem npm install --save csv-stringify