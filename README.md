# Displayed

> An all-in-one digital signage solution intended to present a slideshow of
> images and websites

[![Badge](https://img.shields.io/badge/org-KEG_Amorbach-blue)](https://amorgym.de)
[![Badge](https://img.shields.io/github/v/release/TechnikKEG/Displayed)](https://github.com/TechnikKEG/Displayed/releases/latest)
[![Badge](https://img.shields.io/badge/license-MIT-blue)](https://github.com/TechnikKEG/Displayed/blob/master/LICENSE)

---

## Motivation

After just using USBs and the stock image viewer of whatever smart tvs we were using for the longest time, we were pretty disappointed in the amount of customization that was possible. The lack of precise timing settings and webpage display are a pretty big limitation for us, and combined with the fact that removing the usb, copying new images on, putting it back behind the tv and starting the slideshow are just too many steps for simple updates, we decided to look for a better solution. But after looking for a bit, we could't find anything, that completely met our requirements, so we decided to create our own solution.

## Features

- Support for unlimited screens
- Output using RaspberryPi 3b and up
- Easy display setup using custom RPi firmware image, no setup required if using a wired network connection
- Easy management
- Display group for displaying the same content on multiple screen
- Lightweight frontend and backend
- In-house hosting for the backend

## Contributing

If you want to contribute, please read [this file](CONTRIBUTING.md).

## Mentions

Some of the code for the custom image is inspired by and/or taken from [this article written by David Obdržálek](https://medium.com/@deltazero/making-kioskpi-custom-raspberry-pi-os-image-using-pi-gen-99aac2cd8cb6) and the [corresponding GitHub repository](https://github.com/deltazero-cz/kiosk.pi).\
The image build process is taken from the [pi-gen](https://github.com/RPi-Distro/pi-gen/)-tool. The version included here is based on [commit 75fe47c](https://github.com/RPi-Distro/pi-gen/commit/75fe47c7571c533ad52c43e03b440b0116a157ea) at the time of writing. Stage 3 is a custom stage and falls under the main project license for own parts, and under the [ISC license](https://github.com/deltazero-cz/kiosk.pi/blob/81562aa1507af2b62cc278ae149ae748b3d7c07b/LICENSE) for parts taken from the aforementioned kiosk.pi repository. The generated images, as well as the generation code provided as part of the pi-gen tool fall under [the license of pi-gen](./Image/LICENSE).