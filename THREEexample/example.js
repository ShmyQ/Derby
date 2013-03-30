// standard global variables
var container, scene, camera, renderer, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

// custom global variables

var g = {
    sphere: null,
    jumping: false,
    falling: false,
    currentJumpHeight: 0,
    currentMoveSpeed: {forward: 0,left: 0},
    decelerateCount: 0,
    bounceCounter: 0,
};

var c = {
    // META
    SCREEN_WIDTH: window.innerWidth, 
    SCREEN_HEIGHT: window.innerHeight,
    BG_COLOR: 0xEEEEEE,
    
    // JUMP
    MAX_JUMP_HEIGHT: [120,48,24,12,6], // ARRAY for each bounce
    JUMP_SPEED: 6,
    
    // CAMERA
    VIEW_ANGLE: 70,
    ASPECT: window.innerWidth / window.innerHeight,
    NEAR: 0.1, 
    FAR: 20000,
    CAM_X_OFFSET: 0,
    CAM_Y_OFFSET: 50,
    CAM_Z_OFFSET: 200,
    
    // SPHERE
    SPHERE_SIZE: 50,
    SPHERE_COLOR: 0x00FFFF,
    ACCEL_SPEED: 1,
    MAX_MOVE_SPEED: 8,
    DECELERATE_INTERVAL: 7, // How many keyPress() checks before actually decelerating
    BOUNCE_COUNT: 3,
    
    // FLOOR
    FLOOR_SIZE: 1000,
    FLOOR_COLOR: 0x0000FF,
    FLOOR_Y_OFFSET: -45,
    FLOOR_REPEATS: 10,
    FLOOR_COLOR_1: 0xff0000,
    FLOOR_COLOR_2: 0x00ff00,
    FLOOR_COLOR_3: 0x0000ff,
    
    
    //LIGHT
    LIGHT_POSITION: 100,
    LIGHT_COLOR: 0xffffff,
    
    
};

function init(){
    //--------------------------
    // Create Renderer and Env.
    //--------------------------
 
	if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		renderer = new THREE.CanvasRenderer(); 
        
	renderer.setSize(c.SCREEN_WIDTH, c.SCREEN_HEIGHT);
    
	document.body.appendChild(renderer.domElement);
    
    renderer.setClearColorHex(c.BG_COLOR, 1.0);
    renderer.clear();
    
    // STATS
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
    document.body.appendChild( stats.domElement );
    
    //--------------------------
    // Create Scene / Objects
    //--------------------------
    scene = new THREE.Scene();
    
    //Camera
	camera = new THREE.PerspectiveCamera(c.VIEW_ANGLE,c.ASPECT,c.NEAR,c.FAR);
	scene.add(camera);
	camera.lookAt(scene.position);
    
    // Sphere
    sphere = new THREE.Mesh(new THREE.SphereGeometry(c.SPHERE_SIZE,c.SPHERE_SIZE,c.SPHERE_SIZE), new THREE.MeshLambertMaterial({
        color: c.SPHERE_COLOR
    }));
    sphere.overdraw = true;
    scene.add(sphere);
    
 
    // Add directional light sources
    var directionalLight1 = new THREE.DirectionalLight(c.LIGHT_COLOR);
    directionalLight1.position.set(c.LIGHT_POSITION, c.LIGHT_POSITION, c.LIGHT_POSITION).normalize();
    scene.add(directionalLight1);

    var directionalLight2 = new THREE.DirectionalLight(c.LIGHT_COLOR);
    directionalLight2.position.set(-c.LIGHT_POSITION, c.LIGHT_POSITION, c.LIGHT_POSITION).normalize();
    scene.add(directionalLight2);
    
    var directionalLight3 = new THREE.DirectionalLight(c.LIGHT_COLOR);
    directionalLight3.position.set(c.LIGHT_POSITION, c.LIGHT_POSITION, -c.LIGHT_POSITION).normalize();
    scene.add(directionalLight3);
    
    var directionalLight4 = new THREE.DirectionalLight(c.LIGHT_COLOR);
    directionalLight4.position.set(-c.LIGHT_POSITION, c.LIGHT_POSITION, -c.LIGHT_POSITION).normalize();
    scene.add(directionalLight4);

    // Floor
    // geometrical layout
    var geometry = new THREE.PlaneGeometry(c.FLOOR_SIZE, c.FLOOR_SIZE, c.FLOOR_REPEATS, c.FLOOR_REPEATS );

    // materials
    var materials = []; 
    materials.push(new THREE.MeshBasicMaterial({ color: c.FLOOR_COLOR_1}));
    materials.push(new THREE.MeshBasicMaterial({ color: c.FLOOR_COLOR_2}));
    materials.push(new THREE.MeshBasicMaterial({ color: c.FLOOR_COLOR_3}));

    // assign a material to each face
    for( var i = 0; i < geometry.faces.length; i++ ) {
        geometry.faces[i].materialIndex = (i%3);
    }

    // Create plane
    var plane = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
    plane.rotation.x = -Math.PI/2;
    plane.position.y = c.FLOOR_Y_OFFSET;
    plane.receiveShadow = true;
    scene.add(plane);
    
    animate();
}

//--------------------------
// Update and Render
//--------------------------
function render() {
	renderer.render(scene, camera);
}

function update() {
    checkKeyPress();
    checkMoveState();
    adjustCamera();
	stats.update();
}

//--------------------------
// Animations
//--------------------------
function animate() {
    requestAnimationFrame(animate);
	render();		
	update();
}

function adjustCamera(){
    var delta = clock.getDelta(); // seconds.
    var rotateAngle = Math.PI / 2 * delta;   // pi/2 radians (90 degrees) per second
    // rotate left/right/up/down
	var rotation_matrix = new THREE.Matrix4().identity();
	if (keyboard.pressed("A"))
		rotation_matrix = new THREE.Matrix4().makeRotationY(rotateAngle);
	if (keyboard.pressed("D"))
		rotation_matrix = new THREE.Matrix4().makeRotationY(-rotateAngle);

	if (keyboard.pressed("A") || keyboard.pressed("D")){
		sphere.matrix.multiply(rotation_matrix);
		sphere.rotation.setEulerFromRotationMatrix(sphere.matrix);
	}
	var relativeCameraOffset = new THREE.Vector3(c.CAM_X_OFFSET,c.CAM_YOFF_SET,c.CAM_Z_OFFSET);

	var cameraOffset = relativeCameraOffset.applyMatrix4(sphere.matrixWorld);

	camera.position.x = cameraOffset.x;
	camera.position.z = cameraOffset.z;
	camera.lookAt(sphere.position);
}

function checkKeyPress(){
    
    var accelerateLeft = false;
    var accelerateForward = false;
    
	// MOVEMENT
	if(keyboard.pressed("W")){
         if(g.currentMoveSpeed.forward > -c.MAX_MOVE_SPEED){
            g.currentMoveSpeed.forward -= c.ACCEL_SPEED;
            accelerateForward = true;
         }
    }
	if(keyboard.pressed("S")){
        if(g.currentMoveSpeed.forward < c.MAX_MOVE_SPEED){
            g.currentMoveSpeed.forward += c.ACCEL_SPEED;
            accelerateForward = true;
        }
       
    }
	if(keyboard.pressed("Q")){
        if(g.currentMoveSpeed.left > -c.MAX_MOVE_SPEED){
            g.currentMoveSpeed.left -= c.ACCEL_SPEED;
            accelerateLeft = true;
        }
        
    }
	if(keyboard.pressed("E")){
        if(g.currentMoveSpeed.left < c.MAX_MOVE_SPEED){
            g.currentMoveSpeed.left += c.ACCEL_SPEED;
            accelerateLeft = true;
        }
       
    }
    // DECELERATION
    if(g.decelerateCount < c.DECELERATE_INTERVAL){
        g.decelerateCount++;
    }
    
    else {
        g.decelerateCount = 0;
        if(accelerateForward === false){
            decelerateForward();
        }
        if(accelerateLeft === false){
            decelerateLeft();
        }
    }
    
    // JUMP
    if(keyboard.pressed("space")){
        if(g.jumping === false && g.falling === false)
            jump();
    }
   
    
    
}

function checkMoveState(){    
    sphere.translateZ(g.currentMoveSpeed.forward);
    sphere.translateX(g.currentMoveSpeed.left);
    checkJumpState();
}

function jump() {
    g.jumping = true;
}

function checkJumpState(){
    if(g.jumping === true){
        if(g.currentJumpHeight < c.MAX_JUMP_HEIGHT[g.bounceCounter]){
            sphere.translateY(c.JUMP_SPEED);
            camera.translateY(c.JUMP_SPEED);
            g.currentJumpHeight+= c.JUMP_SPEED;
        }
        else if(g.currentJumpHeight >= c.MAX_JUMP_HEIGHT[g.bounceCounter]){
            g.jumping = false;
            g.falling = true;
        }
        
        else {
            console.log("ERROR ON JUMP")
        }
    }
    
    if(g.falling === true){
        if(g.currentJumpHeight > 0){
            sphere.translateY(-c.JUMP_SPEED);
            camera.translateY(-c.JUMP_SPEED);
            g.currentJumpHeight-= c.JUMP_SPEED;
        }
        else if(g.currentJumpHeight === 0){
            if(g.bounceCounter < c.BOUNCE_COUNT){
                g.jumping = true;
                g.bounceCounter++;
                g.falling = false;
            }
            else {
                g.falling = false;
                g.bounceCounter = 0;
            }
        }
        
        else {
            console.log("ERROR ON FALL");
        }
    }
}

function decelerateForward(){
    if(g.currentMoveSpeed.forward > 0)
         g.currentMoveSpeed.forward--;
    if(g.currentMoveSpeed.forward < 0)
        g.currentMoveSpeed.forward++;
}

function decelerateLeft(){
    if(g.currentMoveSpeed.left > 0)
         g.currentMoveSpeed.left--;
    if(g.currentMoveSpeed.left < 0)
         g.currentMoveSpeed.left++;
}


init();



