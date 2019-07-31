import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Inject, HostListener } from '@angular/core';

import * as THREE from 'three';
import "./EnableThreeExamples";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { SimplifyModifier } from "three/examples/jsm/modifiers/SimplifyModifier.js";
import SpriteText from 'three-spritetext';

@Component({
  selector: 'app-crane',
  templateUrl: './crane.component.html',
  styleUrls: ['./crane.component.css']
})
export class CraneComponent implements OnInit {

  constructor() {
    this.render = this.render.bind(this);
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this.camera = null
    this.scene = null;
    this.raycaster = null;
  }

  @ViewChild('rendererContainer', { static: false }) rendererContainer: ElementRef;
  //Scene Startup (Main)
  renderer = null;
  scene = null;
  camera = null;
  raycaster = null;
  controls = null;
  manager = null;
  mesh = null;
  plane = null;


  //Functionality
  loaded = false;
  popuphelp = null;

  //Text Labels and Sensor Data
  currentlabel = null;

  //Component Groups
  trolleyGroup = [];
  craneBase = null;
  rotatePivot = null;
  

  //Raycasting
  mousex = null;
  mousey = null;
  interactables = null;

  highlightGroup = null;
 
  parentid = null;
  componentSelected = 'None';


  // Resize Window Event Listener =============================================================================================================================
  @HostListener('window:resize', ['$event'])
  onWindowResize(event) {

    var divWidth = document.getElementById("rendererContainer").offsetWidth;
    console.log(divWidth);
    this.camera.aspect = divWidth / window.innerHeight;

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(divWidth, window.innerHeight);
    this.controls.update();
  }

  // ==========================================================================================================================================================

  @HostListener('document:mousemove', ['$event'])
  OnMouseMove(event) {
    //console.log(event);
    if (this.loaded == true) {
      event.preventDefault();

      var rect = this.renderer.domElement.getBoundingClientRect();
      this.mousex = ((event.clientX - rect.left) / (rect.right - rect.left)) * 2 - 1;
      this.mousey = - ((event.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1;


      this.checkIntersect();
      var element = document.getElementById("rendererContainer");
      if (this.componentSelected != 'None') {
        element.style.cursor = "crosshair";
      }

      else {
        element.style.cursor = "auto";
      }

      this.render();
    }
  }


  // MouseClick Event Listener ===============================================================================================================================

  @HostListener('contextmenu', ['$event'])
  StopContextMenu(event) {
    event.preventDefault();
  }

  @HostListener('mousedown', ['$event'])
  OnMouseDown(event) {
    if (this.loaded == true) {

      event.preventDefault();
      var rect = this.renderer.domElement.getBoundingClientRect();

      this.mousex = ((event.clientX - rect.left) / (rect.right - rect.left)) * 2 - 1;
      this.mousey = - ((event.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1;

      if (event.which === 1) { // leftClick

        //this.render();

      }


    }
  }

  // Raycast MouseHover =========================================================================================================================================


  checkIntersect() {
    var scope = this;
    if (this.scene != null && this.raycaster != null) {
      var mouse = new THREE.Vector2(this.mousex, this.mousey), INTERSECTED;
      this.raycaster.setFromCamera(mouse, this.camera);

      var intersects = this.raycaster.intersectObjects(this.interactables, true);
      if (intersects.length > 0) {
        if (INTERSECTED != intersects[0].object) {
          INTERSECTED = intersects[0].object;

          if (INTERSECTED.parent.name.includes("__component__") && !INTERSECTED.parent.name.includes("__highlight_group__")) {

            // Remove all existing highlights =========================================================


            if (this.highlightGroup != null) {

              this.highlightGroup.forEach(function (child) {
                child.material.opacity = 0.8;
                child.material.emissive = new THREE.Color("rgb(0,0,0)");
              })

              this.highlightGroup = null;
            }

            //Remove all Labels ------------------

                //this.scene.remove(this.currentlabel);
                //this.currentlabel = null;

            //Remove all Labels ------------------

            // Remove all existing highlights =========================================================

            var parent = INTERSECTED.parent;
            var temp = parent.name.split('-');
            this.parentid = temp[temp.length - 1];
            this.componentSelected = INTERSECTED.parent.name.replace("__component__", "").split("-")[0].replace("_", " ").replace("_", " ");


            // Make Labels Appear ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

            // Make Labels Appear ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++





            // Construct new highlight =========================================================

            if (this.highlightGroup == null) {
              //var group = new THREE.Group;
              var opaqueList = [];

              parent.children.forEach(function (child) {

                child.material.opacity = 1;
                child.material.emissive = new THREE.Color(0x00FFFF);

                opaqueList.push(child);


              })


              scope.highlightGroup = opaqueList;

              // Construct new highlight =========================================================
            }
          }
        }
      } else {
        // If there are no intersects =========================================================

        INTERSECTED = null;
        this.componentSelected = 'None';
        if (this.highlightGroup != null) {

          this.highlightGroup.forEach(function (child) {

            child.material.opacity = 0.8;
            child.material.emissive = new THREE.Color("rgb(0,0,0)");

          })
        }

        this.highlightGroup = null;

        //Remove all Labels ------------------
        this.scene.remove(this.currentlabel);
        this.currentlabel = null;
        //Remove all Labels ------------------

        // If there are no intersects =========================================================
      }
    }
  }

  // Raycast MouseHover =========================================================================================================================================

  popupHelpOpen() {
    if (this.loaded == true) {
      if (this.popuphelp.style.display == "none") {
        this.popuphelp.style.display = "block";
      }
      else {
        this.popuphelp.style.display = "none";
      }
    }
  }

  resetCamera() {

    if (this.loaded == true) {


      this.controls.reset();
      this.scene.updateMatrixWorld();
      this.camera.position.set(250, 250, 250);
      this.camera.updateProjectionMatrix();
      this.controls.update();

    }
  }




  private initGL(): void {

    // Basic Init
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("rgba(255,255,255,1)");
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.updateProjectionMatrix();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio * 0.8);
    this.renderer.setSize(window.innerWidth * 1, window.innerHeight * 1);
    document.body.appendChild(this.renderer.domElement);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);
    this.raycaster = new THREE.Raycaster();



    // Mouse Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.camera.position.set(250, 250, 250);
    this.camera.updateProjectionMatrix();
    this.controls.update();
    this.controls.addEventListener('mousedown', this.render);



    // Spawn Helper
    var size = 1000;
    var divisions = 80;
    var colorCenterLine = 0xEEEEEE;
    var colorGrid = 0xEEEEEE;
    var gridHelper = new THREE.GridHelper(size, divisions, colorCenterLine, colorGrid);
    this.scene.add(gridHelper);
    //var axesHelper = new THREE.AxesHelper(300);
    //this.scene.add(axesHelper);


    // Spawn Lighting
    var keyLight = new THREE.DirectionalLight(new THREE.Color('hsl(30, 100%, 75%)'), 1.0);
    keyLight.position.set(-100, 0, 100);
    keyLight.name = "keyLight";
    var fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(240, 100%, 75%)'), 0.75);
    fillLight.position.set(100, 0, 100);
    fillLight.name = "fillLight";
    var backLight = new THREE.DirectionalLight(0xffffff, 1.0);
    backLight.position.set(100, 0, -100).normalize();
    backLight.name = "backLight";
    this.scene.add(keyLight);
    this.scene.add(fillLight);
    this.scene.add(backLight);

    ////**********************************************************//
    //// ** THIS IS THE TRUE LOADED COMPLETE. ALWAYS USE ONLOAD **//
    //// Init Loader *********************************************//

    var scope = this;
    this.manager = new THREE.LoadingManager();
    this.manager.onStart = function (url, itemsLoaded, itemsTotal) {

      console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');

    };

    this.manager.onProgress = function (url, itemsLoaded, itemsTotal) {

      console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');

    };

    this.manager.onLoad = function () {

      console.log('Loading complete!');
      scope.interactables = [];
      scope.scene.children.forEach(function (child) {
        if (!child.name.includes('building') && !child.name.includes('plane')) {

          scope.interactables.push(child);
        }

      });


      scope.loaded = true;

      // NECESSARY GAP IN TIME  `````````````````````````````````
      setTimeout(function () {

        scope.popuphelp = document.getElementById("popupHelp");

        var divWidth = document.getElementById("rendererContainer").offsetWidth;
        console.log(divWidth);
        scope.camera.aspect = divWidth / window.innerHeight;

        scope.camera.updateProjectionMatrix();
        scope.renderer.setSize(divWidth, window.innerHeight);
        scope.controls.update();


      }, 0.1);
      // NECESSARY GAP IN TIME  `````````````````````````````````

    };
  }



  private initScene(): void {
    //// Spawn Plane
    var texture = new THREE.TextureLoader().load("assets/images/concrete.jpg");
    var mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.2, map: texture, depthWrite: false });
    var geo = new THREE.BoxGeometry(170, 170, 0.5);
    this.plane = new THREE.Mesh(geo, mat);
    this.plane.rotateX(- Math.PI / 2);
    this.plane.name = "plane";
    this.scene.add(this.plane);
    this.plane.position.x -= 18;
  }




  // Load Obj and Mtl Function ================================================================================================================================

  private loadCraneObject(path, name, manager, scene): void {

    var mtlLoader = new MTLLoader(manager);

    mtlLoader.load(path + name + '.mtl', (materials) => {
      materials.preload();

      var objLoader = new OBJLoader(manager);
      var modifer = new SimplifyModifier();

      objLoader.setMaterials(materials);
      objLoader.load(path + name + '.obj', (object) => {


        object.name = "__component__" + name + '-0';

        object.position.y += 2;
        object.position.x -= 2.5;
        object.position.z += 2.5;

        object.rotation.x = THREE.Math.degToRad( -90 );
        object.scale.set(0.0032, 0.0032, 0.0032);

        object.updateMatrix();
        
        var trolleyNames = ['trolley_1', 'trolley_2'];
        var craneBaseNames = ['climbing_segment', 'body_segment', 'bodyground_base']
        var rotateNames = ['apex', 'cabin', 'crane_jib', 'counterweight', 'fore_connector', 'rear_connector', 'trolley_1', 'trolley_2','motor'];

        object.children.forEach((mesh) => {

          if (mesh instanceof THREE.Mesh && mesh.geometry instanceof THREE.BufferGeometry && mesh.material instanceof THREE.Material) {
            //console.log(mesh)
            mesh.material.transparent = true;
            mesh.material.opacity = 1;
            mesh.material.flatShading = true;

            mesh.geometry.computeVertexNormals();

            var center = new THREE.Vector3();
            mesh.geometry.computeBoundingBox();
            mesh.geometry.boundingBox.getCenter(center);
            mesh.geometry.center();
            mesh.position.copy(center);
            
          }
        })


        // add to componentGroups


        if (this.rotatePivot && rotateNames.includes(name)) {
          this.rotatePivot.add(object);
        }

        else if (this.craneBase && craneBaseNames.includes(name)) {
          this.craneBase.add(object);
        }

        if (trolleyNames.includes(name)) 
          this.trolleyGroup.push(object);

        this.render();
      });
    });
  }

  //===========================================================================================================================================================


  // INITCONTENT ==============================================================================================================================================

  private initContent(): void {

    this.rotatePivot = new THREE.Group();
    this.craneBase = new THREE.Group();
    this.scene.add(this.rotatePivot);
    this.scene.add(this.craneBase);

    // Names of Objects Lists
    var componentMain = ["apex", "bodyground_base", "body_segment", "cabin", "climbing_segment", "counterweight", "crane_jib", "fore_connector", "motor", "rear_connector", "trolley_1", "trolley_2"];

    // Load Obj, Mtl from name (Main Folder)


      componentMain.forEach((name) => {
        var path = 'assets/models/crane/';
        this.loadCraneObject(path, name, this.manager, this.scene);
      })


  }


  // ==========================================================================================================================================================


  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  ngAfterViewInit() {

    this.initGL();
    this.initScene();
    this.initContent();



    let component: CraneComponent = this;



    (function render() {

      component.render();

    }());


    var scope = this;

    var rotateDir = 'CCW';
    var rotateLmt = Math.floor(Math.random() * 180) + 30;;
    var trolleyDir = 'front';

    
    window.setInterval(function () {

      if (rotateDir == 'CW') {

        if (rotateLmt > 0) {
          scope.rotatePivot.rotateY(THREE.Math.degToRad(-0.7));
          rotateLmt -= 0.5

        } else if (rotateLmt <= 0) {

          if (Math.random() > 0.4) rotateDir = 'CCW';
          else rotateDir = 'Pause';

          rotateLmt = Math.floor(Math.random() * 180) + 30;

        }

      }


      else if (rotateDir == 'CCW') {

        if (rotateLmt > 0) {
          scope.rotatePivot.rotateY(THREE.Math.degToRad(0.7));
          rotateLmt -= 0.5

        } else if (rotateLmt <= 0) {

          if (Math.random() > 0.4) rotateDir = 'CW';
          else rotateDir = 'Pause';

          rotateLmt = Math.floor(Math.random() * 180) + 30;

        }

      }

      else if (rotateDir == 'Pause') {

        if (rotateLmt > 0) {

          rotateLmt -= 0.7

        } else if (rotateLmt <= 0) {

          if (Math.random() > 0.5) rotateDir = 'CW';
          else rotateDir = 'CCW';
          
          rotateLmt = Math.floor(Math.random() * 180) + 30;

        }


      }

      

      //scope.rotatePivot.rotateY(THREE.Math.degToRad(0.7));

      scope.trolleyGroup.forEach(function (trolley) {

        if (trolleyDir == 'front') {

          if (trolley.position.x < 50)
            trolley.position.x += 0.3;
          else if (trolley.position.x >= 50)
            trolleyDir = 'back';

        } else if (trolleyDir == 'back') {

          if (trolley.position.x > 0)
            trolley.position.x -= 0.3;
          else if (trolley.position.x <= 0)
            trolleyDir = 'front';
        }


      })
      scope.render();


    }, 50);


  }


}
