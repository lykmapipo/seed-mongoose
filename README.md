seed-mongoose
====================

[![Build Status](https://travis-ci.org/lykmapipo/seed-mongoose.svg?branch=master)](https://travis-ci.org/lykmapipo/seed-mongoose)

DRY data seeding for [mongoose](https://github.com/Automattic/mongoose).

Simplify `mongoose` data seeding based on the current running environment of your application. You may use `seed-mongoose` during `test`, `development` and even seed your application with default data during deployment in `production` environment.

## Installation
```js
$ npm install --save seed-mongoose
```

*You may opt to install [Faker](https://github.com/marak/Faker.js/) as your test and development seed generator*
```js
$ npm install --save-dev faker
```

## Usage
```js
require('seed-mongoose')();
var mongoose = require('mongoose');

...

mongoose.connect('mongodb://localhost/myapp');

```

*Note!: You must require `seed-mongoose` before mongoose, as it uses mongoose [connection events](http://mongoosejs.com/docs/api.html#connection_Connection) to auto seed data.*

## How it works
By default `seed-mongoose` look for environment specific seeds in the `seeds` directory inside `process.cwd()` of your application. Example, if you need to seed your application during `test` you will have to create `seeds/test` and add `model seed files` inside it.

`seed-mongoose` will load any file suffix-ed with `Seed` as a seed unless custom `suffix` provided in [configurations](#configurations). Example, if you want to seed your `User` model during `test` your need to write your seed as folow:

```js
//in seeds/test/UserSeed.js
var faker = require('faker');

//array of plain object
//to seed in User model
module.exports = [{
    username: faker.internet.userName(),
    email: faker.internet.email()
}];
```
When `connecting event` fired by mongoose connection, `seed-mongoose` will then apply all data seed available for the current application environment
. 

## Seed Types
`seed-mongoose` accept `array type`, `plain object` and `functional` type seeds.

#### Object Seed Type
```js
//in seeds/test/UserSeed.js
var faker = require('faker');

//object to seed
//in User model
module.exports = {
    username: faker.internet.userName(),
    email: faker.internet.email()
};
```

#### Array Seed Type
```js
//in seeds/test/UserSeed.js
var faker = require('faker');

//array of data to seed
module.exports = [{
    username: faker.internet.userName(),
    email: faker.internet.email()
}];
```

#### Functional Seed Type
```js
//in seeds/test/UserSeed.js
var faker = require('faker');

//function to be evaluated to obtain data
module.exports = function(done) {

    var data = [{
        username: faker.internet.userName(),
        email: faker.internet.email()
    }, {
        username: faker.internet.userName(),
        email: faker.internet.email()
    }];

    //remember to tell when your are done
    done(null, data);
};
```


The same convection must be followed for `development` and `production` environment.

*Note: Environment specific folder are named after their environment name, e.g if environment is `test`, then to make sure your test seeds are loaded they must be placed under `seeds/test` folder for `seed-mongoose` to pick and apply your seeds. Your may look this repo `seeds folder` to see example*

## Configuration
`seed-mongoose` accept application defined configurations.

Simply, pass the config object into it as below:
```js
var seed = require('seed-mongoose')({
            cwd: 'data',
            path: 'fixtures',
            logger:console,
            environment: 'development',
            active: false
        });
var mongoose = require('mongoose');

...

```

- `cwd` current project working directory. Default to `process.cwd()`
- `path` seed path relative to `cwd`. Default to `seeds`
- `suffix` suffix to use match seeds when loading seeds from a seed directory. Default to `Seed`
- `logger` logger to be used to log progress. Default to `console`
- `environment` seeding environment. Default to `process.env.NODE_ENV`
- `active` signal whether seeding if enable. Default to `true`

## Testing

* Clone this repository

* Install `grunt-cli` global

```sh
$ npm install -g grunt-cli
```

* Install all development dependencies

```sh
$ npm install
```

* Then run test

```sh
$ npm test
```

## Contribute

Fork this repo and push in your ideas. Do not forget to add a bit of test(s) of what value you adding.

## Licence

Copyright (c) 2015 lykmapipo & Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 
