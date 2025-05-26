if [ ! -f config.js ]; then
  cp config-default.js config.js
  echo "config.js created from config-default.js"
else
  echo "config.js already exists"
fi
