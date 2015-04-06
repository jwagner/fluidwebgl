define(function(require, exports, module){

function Loader(root){
    this.root = root || '';
    this.resources = {};
}
Loader.prototype = {
    load: function(resources, ready, error, progress) {
        var pending = 0,
            total = 0,
            failed = 0,
            self = this;

        function success_(src, data){
            self.resources[src] = data;
            pending --;
            if(pending === 0){
                if(ready){
                    ready(self);
                }
            }
            else if(progress) {
                progress(total, pending, failed);
            }
        }
        function error_(src, e){
            pending --;
            failed ++;
            self.resources[src] = null;
            e.src = src;
            if(error){
                error(self, e);
            }
        }

        for(var i = 0; i < resources.length; i++) {
            var resource = resources[i];
            // allows loading in multiple stages
            if(resource in this.resources){
                continue;
            }
            pending ++;
            total ++;
            if(/\.(jpe?g|gif|png)$/.test(resource)){
                this._loadImage(resource, success_, error_);
            }
            else if(/\.(og(g|a)|mp3)$/.test(resource)){
                this._loadAudio(resource, success_, error_);
            }
            else if(/\.json$/.test(resource)){
                this._loadJSON(resource, success_, error_);
            }
            else if(/\.(bin|raw)/.test(resource)){
                this._loadBin(resource, success_, error_);
            }
            else {
                this._loadData(resource, success_, error_);
            }
        }

        if(pending === 0 && ready){
            // always call AFTER the mainloop
            // multiple load calls can result in
            // multiple ready() calls!
            window.setTimeout(function () {
                ready(this);
            }, 1);
        }
        else {
            if(progress){
                progress(total, pending, failed);
            }
        }
    },
    _loadImage: function(src, success, error){
        var self = this;
        var img = document.createElement('img');
        img.onload = function() {
            success(src, img);
        };
        img.onerror = function (e) {
            error(src, e);
        };
        img.src = this.root + src;
    },
    _loadJSON: function(src, success, error){
        var xhr = new XMLHttpRequest(),
            self = this;
        xhr.open('GET', src, true);
        xhr.onload = function() {
            try {
                var data = JSON.parse(this.response);
                success(src, data);
            }
            catch(ex){
                error(src, ex);
            }
        };
        xhr.onerror = function(error) { error(src, error); };
        xhr.send();
    },
    _loadBin: function(src, success, error){
        var xhr = new XMLHttpRequest(),
            self = this;
        xhr.open('GET', src, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function(data) { success(src, this.response); };
        xhr.onerror = function(error) { error(src, error); };
        xhr.send();
    },
    _loadData: function(src, success, error){
        var xhr = new XMLHttpRequest(),
            self = this;
        xhr.open('GET', src, true);
        xhr.onload = function(data) { success(src, this.response); };
        xhr.onerror = function(error) { error(src, error); };
        xhr.send();
    },
    _success: function(src, data) {
    },
    _error: function(src, error) {
    }
};

return Loader;

});
