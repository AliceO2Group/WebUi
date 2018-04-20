# Quality Control GUI (QCG)
QCG is a web graphical user interface for [O<sup>2</sup> Quality Control](https://github.com/AliceO2Group/QualityControl).

## Requirements
- A [TObject2Json](https://github.com/AliceO2Group/QualityControl/blob/master/Framework/src/TObject2JsonServer.cxx) server connected a backend
- nodejs > 7
- [Supported browser](https://github.com/AliceO2Group/WebUi/tree/dev/Framework#minimum-browser-version-support).

## Installation
```
NODE_ENV=production npm install @aliceo2/qc@1.0.0 --loglevel warn --no-save --only=production --no-package-lock
```

## Configuration

### Configuration file
- Open `config.js`
- Fill up missing sections
  - OAuth
  - HTTP
  - TObject2Json

### MySQL database

## Run
```
./start
```
