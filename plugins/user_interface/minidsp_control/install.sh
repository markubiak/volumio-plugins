#!/bin/bash

echo "Installing minidsp control Dependencies"

# node-hid deps for building from source
sudo apt install -y build-essential git libusb-1.0-0 libusb-1.0-0-dev
sudo npm install -g node-gyp

cd /data/plugins/user_interface/minidsp_control
npm install

# copy udev rule
sudo cp 99-minidsp.rules /etc/udev/rules.d
sudo udevadm control --reload-rules

#requred to end the plugin install
echo "plugininstallend"
