#!/bin/bash

# Uninstall dependendencies
# leave build-essential and git installed because they're very useful
sudo apt remove -y libusb-1.0-0 libusb-1.0-0-dev
sudo npm uninstall -g node-gyp

echo "Done"
echo "pluginuninstallend"
