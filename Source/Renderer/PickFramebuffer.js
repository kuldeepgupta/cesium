/*global define*/
define([
        '../Core/defaultValue',
        '../Core/destroyObject',
        '../Core/Color',
        '../Core/DeveloperError',
        '../Core/BoundingRectangle',
        './ClearCommand',
        './PassState',
        './RenderbufferFormat'
    ], function(
        defaultValue,
        destroyObject,
        Color,
        DeveloperError,
        BoundingRectangle,
        ClearCommand,
        PassState,
        RenderbufferFormat) {
    "use strict";

    /**
     * @private
     */
    var PickFramebuffer = function(context) {
        // Override per-command states
        var passState = new PassState();
        passState.blendingEnabled = false;
        passState.scissorTest = {
            enabled : true,
            rectangle : new BoundingRectangle()
        };

        this._context = context;
        this._fb = undefined;
        this._passState = passState;
        this._width = 0;
        this._height = 0;

        // Clear to black.  Since this is the background color, no objects will be black
        this._clearCommand = new ClearCommand(context.createClearState({
            color : new Color(0.0, 0.0, 0.0, 0.0),
            depth : 1.0,
            stencil : 0
        }));
    };

    PickFramebuffer.prototype.begin = function(screenSpaceRectangle) {
        var context = this._context;
        var width = context.getCanvas().clientWidth;
        var height = context.getCanvas().clientHeight;

        BoundingRectangle.clone(screenSpaceRectangle, this._passState.scissorTest.rectangle);

        // Initially create or recreate renderbuffers and framebuffer used for picking
        if ((typeof this._fb === 'undefined') || (this._width !== width) || (this._height !== height)) {
            this._width = width;
            this._height = height;

            this._fb = this._fb && this._fb.destroy();
            this._fb = context.createFramebuffer({
                colorTexture : context.createTexture2D({
                    width : width,
                    height : height
                }),
                depthRenderbuffer : context.createRenderbuffer({
                    format : RenderbufferFormat.DEPTH_COMPONENT16
                })
            });
            this._passState.framebuffer = this._fb;
        }

        this._clearCommand.execute(context, this._passState);

        return this._passState;
    };

    var colorScratch = new Color();

    PickFramebuffer.prototype.end = function(screenSpaceRectangle) {
        var width = defaultValue(screenSpaceRectangle.width, 1.0);
        var height = defaultValue(screenSpaceRectangle.height, 1.0);

        var context = this._context;
        var pixels = context.readPixels({
            x : screenSpaceRectangle.x,
            y : screenSpaceRectangle.y,
            width : width,
            height : height,
            framebuffer : this._fb
        });

        var max = Math.max(width, height);
        var length = max * max;
        var halfWidth = Math.floor(width * 0.5);
        var halfHeight = Math.floor(height * 0.5);

        var x = 0;
        var y = 0;
        var dx = 0;
        var dy = -1;

        // Spiral around the center pixel, this is a workaround until
        // we can access the depth buffer on all browsers.

        // The region does not have to square and the dimensions do not have to be odd, but
        // loop iterations would be wasted. Prefer square regions where the size is odd.
        for (var i = 0; i < length; ++i) {
            if (-halfWidth <= x && x <= halfWidth && -halfHeight <= y && y <= halfHeight) {
                var index = 4 * ((halfHeight - y) * width + x + halfWidth);

                colorScratch.red = Color.byteToFloat(pixels[index]);
                colorScratch.green = Color.byteToFloat(pixels[index + 1]);
                colorScratch.blue = Color.byteToFloat(pixels[index + 2]);
                colorScratch.alpha = Color.byteToFloat(pixels[index + 3]);

                var object = context.getObjectByPickColor(colorScratch);
                if (typeof object !== 'undefined') {
                    return object;
                }
            }

            // if (top right || bottom left corners) || (top left corner) || (bottom right corner + (1, 0))
            // change spiral direction
            if (x === y || (x < 0 && -x === y) || (x > 0 && x === 1 - y)) {
                var temp = dx;
                dx = -dy;
                dy = temp;
            }

            x += dx;
            y += dy;
        }

        return undefined;
    };

    PickFramebuffer.prototype.isDestroyed = function() {
        return false;
    };

    PickFramebuffer.prototype.destroy = function() {
        this._fb = this._fb && this._fb.destroy();
        return destroyObject(this);
    };

    return PickFramebuffer;
});