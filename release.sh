#!/bin/bash
rsync -vrt --copy-links --exclude release.sh --exclude .git * x.29a.ch:/var/www/29a.ch/sandbox/2012/fluidwebgl
