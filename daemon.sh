#!/bin/bash

. ./.nvm/nvm.sh
nvm use $1
node index.js
