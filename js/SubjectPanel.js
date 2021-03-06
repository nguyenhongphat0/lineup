function createSubjectPanel(renderer, scale){

   var STANDARD_DIMENSIONS = {width: 400, height:500},
       ROTATE_TIME = 10.0;

   var width = STANDARD_DIMENSIONS.width * scale,
       height = STANDARD_DIMENSIONS.height * scale,
       renderScene,
       renderComposer,
       renderCamera,
       videoMaterial,
       brightnessContrastPass;

   var targetParams = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat};
   var renderTarget = new THREE.WebGLRenderTarget(width, height, targetParams);
   var quad = new THREE.Mesh( new THREE.PlaneBufferGeometry(width, height), new THREE.MeshBasicMaterial({map: renderTarget, transparent: true, opacity: 0}));

   // quad.scale.set(1.34,1.34,1.34);

   var subjectShader =  {
       uniforms : {
           "tDiffuse": { type: "t", value: null },
           "cMaskColor": { type: "c", value: new THREE.Color(0x182e41) },
       },
       vertexShader: [
           "varying vec2 vUv;",

           "void main() {",

           "vUv = uv;",
           "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

           "}"
       ].join('\n'),
       fragmentShader: [
       "uniform sampler2D tDiffuse;",
       "uniform vec3 cMaskColor;",
       "varying vec2 vUv;",
        "bool checkBlue(vec3 colorIn){",
        "   return (colorIn.g > colorIn.r + colorIn.b + .05);",
        "}",
        "void main()", 
        "{",
        "   vec4 texel = texture2D(tDiffuse, vUv);",
        " if(checkBlue(texel.rgb)){",
        "    texel.a = 0.0;",
        " }",
        " if(checkBlue(texture2D(tDiffuse, vec2(vUv.x + .003, vUv.y)).rgb)){",
        "    texel.a = texel.a * 0.4;",
        " }",
        " if(checkBlue(texture2D(tDiffuse, vec2(vUv.x, vUv.y + .002)).rgb)){",
        "    texel.a = texel.a * 0.4;",
        " }",
        " if(checkBlue(texture2D(tDiffuse, vec2(vUv.x - .003, vUv.y)).rgb)){",
        "    texel.a = texel.a * 0.4;",
        " }",
        " if(checkBlue(texture2D(tDiffuse, vec2(vUv.x, vUv.y - .005)).rgb)){",
        "    texel.a = texel.a * 0.4;",
        " }",
        " if(checkBlue(texture2D(tDiffuse, vec2(vUv.x + .005, vUv.y)).rgb)){",
        "    texel.a = texel.a * 0.6;",
        " }",
        " if(checkBlue(texture2D(tDiffuse, vec2(vUv.x, vUv.y + .004)).rgb)){",
        "    texel.a = texel.a * 0.6;",
        " }",
        " if(checkBlue(texture2D(tDiffuse, vec2(vUv.x - .005, vUv.y)).rgb)){",
        "    texel.a = texel.a * 0.6;",
        " }",
        " if(checkBlue(texture2D(tDiffuse, vec2(vUv.x, vUv.y - .004)).rgb)){",
        "    texel.a = texel.a * 0.6;",
        " }",
        "   gl_FragColor = texel;",
        "}"
       ].join('\n')
   };


    function createRenderTarget(width, height){
        var params = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat};
        return new THREE.WebGLRenderTarget(width, height, params);
    }

    function init(){
        var videoTexture,
            video;

        renderCamera = new THREE.OrthographicCamera(0, width-1, height, 0, -1000, 1000),
        renderScene = new THREE.Scene();


        if(VIDEO_ENABLED){
            video = document.getElementById( 'video' );
            videoTexture = new THREE.VideoTexture( video );
            videoTexture.minFilter = THREE.LinearFilter;
            videoTexture.magFilter = THREE.LinearFilter;
            videoTexture.format = THREE.RGBAFormat;

            subjectShader.uniforms.tDiffuse.value = videoTexture;
            videoMaterial = new THREE.ShaderMaterial({
                uniforms: subjectShader.uniforms,
                vertexShader: subjectShader.vertexShader,
                fragmentShader: subjectShader.fragmentShader,
                transparent: true,
            });
        } else {
            videoMaterial = new THREE.MeshBasicMaterial({transparent: true, map: THREE.ImageUtils.loadTexture("images/snapshot_with_error.png", undefined, LOADSYNC.register())});

        }



        var planegeometry = new THREE.PlaneBufferGeometry( width, height );

        var plane = new THREE.Mesh( planegeometry, videoMaterial );
        plane.position.set(width/2, height/2, 0);
        renderScene.add( plane );

        renderComposer = new THREE.EffectComposer(renderer, renderTarget);
        renderComposer.addPass(new THREE.RenderPass(renderScene, renderCamera));
        renderComposer.addPass(new THREE.ShaderPass(THREE.BrightnessContrastShader, {contrast: 0, brightness: -.07}));
        renderComposer.addPass(new THREE.ShaderPass(THREE.FXAAShader, {resolution: new THREE.Vector2(1/width, 1/height)}));

    }

    function render(){
        renderComposer.render();
    }

    function setPosition(x, y, z){
        if(typeof z == "number"){
            z = Math.max(0, Math.min(1, z));
            setBlur(z);
            quad.scale.set(z/2 + .5, z/2 + .5, z/2 + .5);
        }
        quad.position.set(x + width/2, y-height/2, 0);
    }

    function setBlur(){}

    function checkBounds(x, y){
        return (x > quad.position.x - width / 2 && x < quad.position.x + width/2) 
               && (y > quad.position.y - height / 2 && y < quad.position.y + height/2);
    }

    function setBrightness(level){
        quad.material.opacity = Math.min(1, level * 3);
    }

    init();

    return Object.freeze({
        toString: function(){return "SubjectPanel"},
        render: render,
        renderTarget: renderTarget,
        width: width,
        height: height,
        quad: quad,
        checkBounds: checkBounds,
        setBlur: setBlur,
        setPosition: setPosition,
        setBrightness: setBrightness
    });
}

