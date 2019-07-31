import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Inject, HostListener } from '@angular/core';

import * as THREE from 'three';
import "./EnableThreeExamples";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { SimplifyModifier } from "three/examples/jsm/modifiers/SimplifyModifier.js";
import SpriteText from 'three-spritetext';
import { match } from 'minimatch';

@Component({
  selector: 'app-vessel',
  templateUrl: './vessel.component.html',
  styleUrls: ['./vessel.component.css']
})
export class VesselComponent implements OnInit {

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
  vessel = null;

  //Functionality
  loaded = false;
  popuphelp = null;
  turnValue = 0;
  speedValue = 1.5;

  //Text Labels and Sensor Data
  currentlabel = null;

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


  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event) {
    event.preventDefault();
    //console.log(event);
    if (event.key == "a" && this.turnValue > -10) {
      this.turnValue -= 0.05;
    }

    else if (event.key == 'd' && this.turnValue < 10) {
      this.turnValue += 0.05;
    }

    else if (event.key == 'w' && this.speedValue < 10) {
      this.speedValue += 0.05;
    }

    else if (event.key == 's' && this.speedValue > 0) {
      this.speedValue -= 0.05;
    }

    this.vessel.rotation.y = THREE.Math.degToRad(- this.turnValue / 10 * 180);
    this.vessel.rotation.z = THREE.Math.degToRad(- this.turnValue / 2.5);

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


  onTurnChange(event) {
    if (this.vessel && this.loaded) {
      this.turnValue = event.value;
      this.vessel.rotation.y = THREE.Math.degToRad(- event.value / 10 * 180);
      this.vessel.rotation.z = THREE.Math.degToRad(- event.value / 2.5);
     
    }
  }

  onSpeedChange(event) {
    if (this.vessel && this.loaded) {
      this.speedValue = event.value;
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
    this.controls.addEventListener('change', this.render);



    // Spawn Helper
    var size = 1000;
    var divisions = 80;
    var colorCenterLine = 0xEEEEEE;
    var colorGrid = 0xEEEEEE;
    var gridHelper = new THREE.GridHelper(size, divisions, colorCenterLine, colorGrid);
    this.scene.add(gridHelper);
    //var axesHelper = new THREE.AxesHelper(10);
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
    //var texture = new THREE.TextureLoader().load("assets/images/water.jpg");
    //var mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.35 , map: texture, depthWrite: true });
    //var geo = new THREE.BoxGeometry(500, 500, 50);
    //this.plane = new THREE.Mesh(geo, mat);
    //this.plane.rotateX(- Math.PI / 2);
    //this.plane.name = "plane";
    //this.scene.add(this.plane);
    //this.plane.position.y -= 17;
  }




  // Load Obj and Mtl Function ================================================================================================================================

  private loadVesselObject(path, name, manager, scene): void {

    var mtlLoader = new MTLLoader(manager);

    mtlLoader.load(path + name + '.mtl', (materials) => {
      materials.preload();

      var objLoader = new OBJLoader(manager);

      objLoader.setMaterials(materials);
      objLoader.load(path + name + '.obj', (object) => {


        object.name = "__component__" + name + '-0';

        object.position.y -= 9;
        //object.position.x -= 2.5;
        //object.position.z += 2.5;

        //object.rotation.x = THREE.Math.degToRad(-90);
        object.scale.set(0.005, 0.005, 0.005);

        object.updateMatrix();

        object.children.forEach((mesh) => {

          if (mesh instanceof THREE.Mesh && mesh.geometry instanceof THREE.BufferGeometry && mesh.material instanceof THREE.Material) {
            //console.log(mesh)
            //mesh.material.transparent = true;
            //mesh.material.opacity = 0.8;
            //mesh.material.flatShading = true;

            mesh.geometry.computeVertexNormals();

            this.colorMesh(name, mesh);

            var center = new THREE.Vector3();
            mesh.geometry.computeBoundingBox();
            mesh.geometry.boundingBox.getCenter(center);
            mesh.geometry.center();
            mesh.position.copy(center);

          }
        })


        // add to componentGroups
        this.vessel.add(object);




 

        this.render();
      });
    });
  }

  //===========================================================================================================================================================

  private colorMesh(name, mesh): void {

    if (name == "body" || name.includes("propeller") || name == "cabin")
      mesh.material.color = new THREE.Color(0x004080);
    else if (name == "rings")
      mesh.material.color = new THREE.Color(0xff0000);
    else if (name == "tug_crane")
      mesh.material.color = new THREE.Color(0xffff00);
    else if (name == "liferaft")
      mesh.material.color = new THREE.Color(0xff4500);
    else if (name == "bow_winch")
      mesh.material.color = new THREE.Color(0xC0C0C0);

  }
  

  // INITCONTENT ==============================================================================================================================================

  private initContent(): void {

    this.vessel = new THREE.Group();
    this.scene.add(this.vessel);

    // Names of Objects Lists
    var componentMain = ["body","bow_winch","cabin","liferaft","propeller_1","propeller_2","rings","rubber_boat","tug_crane"]

    // Load Obj, Mtl from name (Main Folder)


    componentMain.forEach((name) => {
      var path = 'assets/models/vessel/';
      this.loadVesselObject(path, name, this.manager, this.scene);
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



    let component: VesselComponent = this;



    (function render() {

      component.render();

    }());



    var scope = this;

    window.setInterval(function () {

      scope.vessel.position.z -= scope.speedValue * Math.sin(scope.vessel.rotation.y + THREE.Math.degToRad(90));
      scope.vessel.position.x += scope.speedValue * Math.cos(scope.vessel.rotation.y + THREE.Math.degToRad(90));

      scope.render();

    }, 70);


  }


}
