# @opentranslate/tencent

[![npm-version](https://img.shields.io/npm/v/@opentranslate/tencent.svg)](https://www.npmjs.com/package/@opentranslate/tencent)
[![OpenTranslate](https://img.shields.io/badge/OpenTranslate-Compatible-brightgreen)](https://github.com/OpenTranslate)

Tencent translator with [OpenTranslate](https://github.com/OpenTranslate) API.

## Installation

Yarn

```
yarn add @opentranslate/tencent
```

NPM

```
npm i @opentranslate/tencent
```

## Usage

```
import Tencent from '@opentranslate/tencent'

const tencent = new Tencent()

tencent.translate('text').then(console.log)
```

## API

See [translator](https://github.com/OpenTranslate/OpenTranslate/blob/master/packages/translator/README.md) for more details.
## Note 
To access the TTS uri, you're required to send request with `headers: { Origin: "https://fanyi.qq.com" }`

## Disclaimer

The material and source code from this package are for study and research purposes only. Any reliance you place on such material or source code are strictly at your own risk.
