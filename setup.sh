#!/bin/bash

sed -i "s@%SERVER_URL%@$SERVER_URL@g" public/javascripts/client.js
