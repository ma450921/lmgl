// TODO: render lists - opaque and transparent
// TODO: sort opaque list in order of program
// TODO: culling
// TODO: cnv.addEventListener('webglcontextlost', contextLost, false);
// TODO: cnv.addEventListener('webglcontextrestored', contextRestore, false);

// Not automatic - devs to use these methods manually
// gl.colorMask( colorMask, colorMask, colorMask, colorMask );
// gl.clearColor( r, g, b, a );
// gl.stencilMask( stencilMask );
// gl.stencilFunc( stencilFunc, stencilRef, stencilMask );
// gl.stencilOp( stencilFail, stencilZFail, stencilZPass );
// gl.clearStencil( stencil );

export class Renderer {
    constructor({
        canvas = document.createElement('canvas'),
        width = 300,
        height = 150,
        dpr = 1,
        alpha = false,
        depth = true,
        stencil = false,
        antialias = false,
        premultipliedAlpha = false,
        preserveDrawingBuffer = false,
        powerPreference = 'default',
        autoClear = true,
    } = {}) {
        const attributes = {alpha, depth, stencil, antialias, premultipliedAlpha, preserveDrawingBuffer, powerPreference};
        this.dpr = dpr;
        this.alpha = alpha;
        this.color = true;
        this.depth = depth;
        this.stencil = stencil;
        this.premultipliedAlpha = premultipliedAlpha;
        this.autoClear = autoClear;

        // Attempt WebGL2, otherwise fallback to WebGL1
        this.gl = canvas.getContext('webgl2', attributes);
        this.isWebgl2 = !!this.gl;
        if (!this.gl) {
            this.gl = canvas.getContext('webgl', attributes) || canvas.getContext('experimental-webgl', attributes);
        }

        // Attach renderer to gl so that all classes have access to gl state functions
        this.gl.renderer = this;

        // gl state stores to avoid redundant calls on methods used internally
        this.state = {};
        this.state.blendFunc = {src: this.gl.ONE, dst: this.gl.ZERO};
        this.state.blendEquation = {modeRGB: this.gl.FUNC_ADD};
        this.state.cullFace = null;
        this.state.frontFace = this.gl.CCW;
        this.state.depthMask = true;
        this.state.depthFunc = this.gl.LESS;
        this.state.framebuffer = null;
        this.state.viewport = {width: null, height: null};

        // store requested extensions
        this.extensions = {};

        if (!this.isWebgl2) {

            // Initialise extra format types
            this.getExtension('OES_texture_float');
            this.getExtension('OES_texture_float_linear');
            this.getExtension('OES_texture_half_float');
            this.getExtension('OES_element_index_uint');
            this.getExtension('OES_standard_derivatives');
            this.getExtension('EXT_sRGB');
            this.getExtension('WEBGL_depth_texture');
        }

        // Set initial size and viewport state
        this.setSize(width, height);
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;

        this.gl.canvas.width = width * this.dpr;
        this.gl.canvas.height = height * this.dpr;

        Object.assign(this.gl.canvas.style, {
            width: width + 'px',
            height: height + 'px',
        });

        this.setViewport(width * this.dpr, height * this.dpr);
    }

    setViewport(width, height) {
        if (this.state.viewport.width === width && this.state.viewport.height === height) return;
        this.state.viewport.width = width;
        this.state.viewport.height = height;
        this.gl.viewport(0, 0, width, height);
    }

    enable(id) {
        if (this.state[id] === true) return;
        this.gl.enable(id);
        this.state[id] = true;
    }

    disable(id) {
        if (this.state[id] === false) return;
        this.gl.disable(id);
        this.state[id] = false;
    }

    setBlendFunc(src, dst, srcAlpha, dstAlpha) {
        if (this.state.blendFunc.src === src &&
            this.state.blendFunc.dst === dst &&
            this.state.blendFunc.srcAlpha === srcAlpha &&
            this.state.blendFunc.dstAlpha === dstAlpha) return;
        this.state.blendFunc.src = src;
        this.state.blendFunc.dst = dst;
        this.state.blendFunc.srcAlpha = srcAlpha;
        this.state.blendFunc.dstAlpha = dstAlpha;
        if (srcAlpha !== undefined) this.gl.blendFuncSeparate(src, dst, srcAlpha, dstAlpha);
        else this.gl.blendFunc(src, dst);
    }

    setBlendEquation(modeRGB, modeAlpha) {
        if (this.state.blendEquation.modeRGB === modeRGB &&
            this.state.blendEquation.modeAlpha === modeAlpha) return;
        this.state.blendEquation.modeRGB = modeRGB;
        this.state.blendEquation.modeAlpha = modeAlpha;
        if (modeAlpha !== undefined) this.gl.blendEquationSeparate(modeRGB, modeAlpha);
        else this.gl.blendEquation(modeRGB);
    }

    setCullFace(value) {
        if (this.state.cullFace === value) return;
        this.state.cullFace = value;
        this.gl.cullFace(value);
    }

    setFrontFace(value) {
        if (this.state.frontFace === value) return;
        this.state.frontFace = value;
        this.gl.frontFace(value);
    }

    setDepthMask(value) {
        if (this.state.depthMask === value) return;
        this.state.depthMask = value;
        this.gl.depthMask(value);
    }

    setDepthFunc(value) {
        if (this.state.depthFunc === value) return;
        this.state.depthFunc = value;
        this.gl.depthFunc(value);
    }

    bindFramebuffer({target = this.gl.FRAMEBUFFER, buffer = null} = {}) {
        if (this.state.framebuffer === buffer) return;
        this.state.framebuffer = buffer;
        this.gl.bindFramebuffer(target, buffer);
    }

    getExtension(extension, webgl2Func, extFunc) {

        // if webgl2 function supported, return func bound to gl context
        if (webgl2Func && this.gl[webgl2Func]) return this.gl[webgl2Func].bind(this.gl);

        // fetch extension once only
        if (!this.extensions[extension]) {
            this.extensions[extension] = this.gl.getExtension(extension);
        }

        // return extension if no function requested
        if (!webgl2Func) return this.extensions[extension];

        // return extension function, bound to extension
        return this.extensions[extension][extFunc].bind(this.extensions[extension]);
    }

    render({
        scene,
        camera,
        target = null,
    }) {

        if (target === null) {

            // make sure no render target bound to draw to canvas
            this.bindFramebuffer();
            this.setViewport(this.width * this.dpr, this.height * this.dpr);
        } else {

            // bind supplied render target
            this.bindFramebuffer(target);
            this.setViewport(target.width, target.height);
        }

        if (this.autoClear) {

            // Ensure depth buffer writing is enabled so it can be cleared
            if (this.depth) {
                this.enable(this.gl.DEPTH_TEST);
                this.setDepthMask(true);
            }
            this.gl.clear((this.color ? this.gl.COLOR_BUFFER_BIT : 0) | (this.depth ? this.gl.DEPTH_BUFFER_BIT : 0) | (this.stencil ? this.gl.STENCIL_BUFFER_BIT : 0));
        }

        // updates all scene graph matrices
        scene.updateMatrixWorld();

        // Update camera separately if not in scene graph
        if (camera && camera.parent === null) camera.updateMatrixWorld();

        scene.traverse(node => {
            if (!node.draw) return;
            node.draw({camera});
        });

        // SORTING using a proj matrix to get distance from cam
        // _projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
        // _frustum.setFromMatrix( _projScreenMatrix );
        // if ( _this.sortObjects === true ) {
        //     opaqueObjects.sort( painterSortStable );
        //     transparentObjects.sort( reversePainterSortStable );
        // }
        // culling

        // state.setBlending( NoBlending );
        // renderObjects( opaqueObjects, scene, camera );
        // // transparent pass (back-to-front order)
        // renderObjects( transparentObjects, scene, camera );

        // never call gl.get anything during render
    }
}