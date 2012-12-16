min:
	mkdir -p build
	r.js -o baseUrl=src name=almond include=main insertRequire=main out=build/main.js wrap=true
	sed 's/lib\/require\.js/main.js/g' index.html| sed 's/data-main=src\/main/ /g' > build/index.html
	cp -r *.png *.jpg *.css shaders build

sync:
	rsync -vrt --copy-links --exclude release.sh build/* 29a.ch:/var/www/29a.ch/sandbox/2012/fluidwebgl/

release: min sync
