/**
 * skinview3d <https://github.com/to2mbn/skinview3d>
 *
 * Copyright (C) 2017 the original author or authors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
let skinview3d = new function(){
	/**
	 * @author yushijinhun <https://github.com/yushijinhun>
	 * @author Hacksore <https://github.com/Hacksore>
	 * @author Kent Rasmussen <https://github.com/earthiverse>
	 */
	"use strict";

	let copyImage = (context, sX, sY, w, h, dX, dY, flipHorizontal) => {
		let imgData = context.getImageData(sX, sY, w, h);
		if(flipHorizontal){
			for(let y = 0; y < h; y++) {
				for(let x = 0; x < (w / 2); x++) {
					let index = (x + y * w) * 4;
					let index2 = ((w - x - 1) + y * w) * 4;
					let pA1 = imgData.data[index];
					let pA2 = imgData.data[index+1];
					let pA3 = imgData.data[index+2];
					let pA4 = imgData.data[index+3];

					let pB1 = imgData.data[index2];
					let pB2 = imgData.data[index2+1];
					let pB3 = imgData.data[index2+2];
					let pB4 = imgData.data[index2+3];

					imgData.data[index] = pB1;
					imgData.data[index+1] = pB2;
					imgData.data[index+2] = pB3;
					imgData.data[index+3] = pB4;

					imgData.data[index2] = pA1;
					imgData.data[index2+1] = pA2;
					imgData.data[index2+2] = pA3;
					imgData.data[index2+3] = pA4;
				}
			}
		}
		context.putImageData(imgData,dX,dY);
	};

	let convertSkinTo1_8 = (context, width) => {
		let scale = width/64.0;
		let copySkin = (context, sX, sY, w, h, dX, dY, flipHorizontal) => copyImage(context, sX*scale, sY*scale, w*scale, h*scale, dX*scale, dY*scale, flipHorizontal);

		copySkin(context, 4, 16, 4, 4, 20, 48, true); // Top Leg
		copySkin(context, 8, 16, 4, 4, 24, 48, true); // Bottom Leg
		copySkin(context, 0, 20, 4, 12, 24, 52, true); // Outer Leg
		copySkin(context, 4, 20, 4, 12, 20, 52, true); // Front Leg
		copySkin(context, 8, 20, 4, 12, 16, 52, true); // Inner Leg
		copySkin(context, 12, 20, 4, 12, 28, 52, true); // Back Leg
		copySkin(context, 44, 16, 4, 4, 36, 48, true); // Top Arm
		copySkin(context, 48, 16, 4, 4, 40, 48, true); // Bottom Arm
		copySkin(context, 40, 20, 4, 12, 40, 52, true); // Outer Arm
		copySkin(context, 44, 20, 4, 12, 36, 52, true); // Front Arm
		copySkin(context, 48, 20, 4, 12, 32, 52, true); // Inner Arm
		copySkin(context, 52, 20, 4, 12, 44, 52, true); // Back Arm
	};

	let toFaceVertices = (x1,y1,x2,y2,w,h) => [
		new THREE.Vector2(x1/w, 1.0-y2/h),
		new THREE.Vector2(x2/w, 1.0-y2/h),
		new THREE.Vector2(x2/w, 1.0-y1/h),
		new THREE.Vector2(x1/w, 1.0-y1/h)
	];

	let toSkinVertices = (x1,y1,x2,y2) => toFaceVertices(x1, y1, x2, y2, 64.0, 64.0);
	let toCapeVertices = (x1,y1,x2,y2) => toFaceVertices(x1, y1, x2, y2, 64.0, 32.0);

	let addVertices = (box,top,bottom,left,front,right,back) => {
		box.faceVertexUvs[0] = [];
		box.faceVertexUvs[0][0] = [right[3], right[0], right[2]];
		box.faceVertexUvs[0][1] = [right[0], right[1], right[2]];
		box.faceVertexUvs[0][2] = [left[3], left[0], left[2]];
		box.faceVertexUvs[0][3] = [left[0], left[1], left[2]];
		box.faceVertexUvs[0][4] = [top[3], top[0], top[2]];
		box.faceVertexUvs[0][5] = [top[0], top[1], top[2]];
		box.faceVertexUvs[0][6] = [bottom[0], bottom[3], bottom[1]];
		box.faceVertexUvs[0][7] = [bottom[3], bottom[2], bottom[1]];
		box.faceVertexUvs[0][8] = [front[3], front[0], front[2]];
		box.faceVertexUvs[0][9] = [front[0], front[1], front[2]];
		box.faceVertexUvs[0][10] = [back[3], back[0], back[2]];
		box.faceVertexUvs[0][11] = [back[0], back[1], back[2]];
	};

	const esp = 0.002;

	this.SkinObject = class extends THREE.Group {
		constructor(isSlim, layer1Material, layer2Material) {
			super();

			// Head
			this.head = new THREE.Group();

			let headBox = new THREE.BoxGeometry(8, 8, 8, 0, 0, 0);
			addVertices(headBox,
				toSkinVertices(8, 0, 16, 8),
				toSkinVertices(16, 0, 24, 8),
				toSkinVertices(0, 8, 8, 16),
				toSkinVertices(8, 8, 16, 16),
				toSkinVertices(16, 8, 24, 16),
				toSkinVertices(24, 8, 32, 16)
			);
			let headMesh = new THREE.Mesh(headBox, layer1Material);
			this.head.add(headMesh);

			let head2Box = new THREE.BoxGeometry(9, 9, 9, 0, 0, 0);
			addVertices(head2Box,
				toSkinVertices(40, 0, 48, 8),
				toSkinVertices(48, 0, 56, 8),
				toSkinVertices(32, 8, 40, 16),
				toSkinVertices(40, 8, 48, 16),
				toSkinVertices(48, 8, 56, 16),
				toSkinVertices(56, 8, 64, 16)
			);
			let head2Mesh = new THREE.Mesh(head2Box, layer2Material);
			head2Mesh.renderOrder = -1;
			this.head.add(head2Mesh);

			this.add(this.head);


			// Body
			this.body = new THREE.Group();

			let bodyBox = new THREE.BoxGeometry(8, 12, 4, 0, 0, 0);
			addVertices(bodyBox,
				toSkinVertices(20, 16, 28, 20),
				toSkinVertices(28, 16, 36, 20),
				toSkinVertices(16, 20, 20, 32),
				toSkinVertices(20, 20, 28, 32),
				toSkinVertices(28, 20, 32, 32),
				toSkinVertices(32, 20, 40, 32)
			);
			let bodyMesh = new THREE.Mesh(bodyBox, layer1Material);
			this.body.add(bodyMesh);

			let body2Box = new THREE.BoxGeometry(9, 13.5, 4.5, 0, 0, 0);
			addVertices(body2Box,
				toSkinVertices(20, 32, 28, 36),
				toSkinVertices(28, 32, 36, 36),
				toSkinVertices(16, 36, 20, 48),
				toSkinVertices(20, 36, 28, 48),
				toSkinVertices(28, 36, 32, 48),
				toSkinVertices(32, 36, 40, 48)
			);
			let body2Mesh = new THREE.Mesh(body2Box, layer2Material);
			this.body.add(body2Mesh);

			this.body.position.y = -10;
			this.add(this.body);


			// Right Arm
			this.rightArm = new THREE.Group();
			let rightArmPivot = new THREE.Group();

			let rightArmBox = new THREE.BoxGeometry((isSlim?3:4)-esp, 12-esp, 4-esp, 0, 0, 0);
			if (isSlim) {
				addVertices(rightArmBox,
					toSkinVertices(44, 16, 47, 20),
					toSkinVertices(47, 16, 50, 20),
					toSkinVertices(40, 20, 44, 32),
					toSkinVertices(44, 20, 47, 32),
					toSkinVertices(47, 20, 51, 32),
					toSkinVertices(51, 20, 54, 32)
				);
			} else {
				addVertices(rightArmBox,
					toSkinVertices(44, 16, 48, 20),
					toSkinVertices(48, 16, 52, 20),
					toSkinVertices(40, 20, 44, 32),
					toSkinVertices(44, 20, 48, 32),
					toSkinVertices(48, 20, 52, 32),
					toSkinVertices(52, 20, 56, 32)
				);
			}
			let rightArmMesh = new THREE.Mesh(rightArmBox, layer1Material);
			rightArmPivot.add(rightArmMesh);

			let rightArm2Box = new THREE.BoxGeometry((isSlim?3.375:4.5)-esp, 13.5-esp, 4.5-esp, 0, 0, 0);
			if (isSlim) {
				addVertices(rightArm2Box,
					toSkinVertices(44, 32, 47, 36),
					toSkinVertices(47, 32, 50, 36),
					toSkinVertices(40, 36, 44, 48),
					toSkinVertices(44, 36, 47, 48),
					toSkinVertices(47, 36, 51, 48),
					toSkinVertices(51, 36, 54, 48)
				);
			} else {
				addVertices(rightArm2Box,
					toSkinVertices(44, 32, 48, 36),
					toSkinVertices(48, 32, 52, 36),
					toSkinVertices(40, 36, 44, 48),
					toSkinVertices(44, 36, 48, 48),
					toSkinVertices(48, 36, 52, 48),
					toSkinVertices(52, 36, 56, 48)
				);
			}
			let rightArm2Mesh = new THREE.Mesh(rightArm2Box, layer2Material);
			rightArm2Mesh.renderOrder = 1;
			rightArmPivot.add(rightArm2Mesh);

			rightArmPivot.position.y = -6;
			this.rightArm.add(rightArmPivot);
			this.rightArm.position.y = -4;
			this.rightArm.position.x = isSlim?-5.5:-6;
			this.add(this.rightArm);


			// Left Arm
			this.leftArm = new THREE.Group();
			let leftArmPivot = new THREE.Group();

			let leftArmBox = new THREE.BoxGeometry((isSlim?3:4)-esp, 12-esp, 4-esp, 0, 0, 0);
			if (isSlim) {
				addVertices(leftArmBox,
					toSkinVertices(36, 48, 39, 52),
					toSkinVertices(39, 48, 42, 52),
					toSkinVertices(32, 52, 36, 64),
					toSkinVertices(36, 52, 39, 64),
					toSkinVertices(39, 52, 43, 64),
					toSkinVertices(43, 52, 46, 64)
				);
			} else {
				addVertices(leftArmBox,
					toSkinVertices(36, 48, 40, 52),
					toSkinVertices(40, 48, 44, 52),
					toSkinVertices(32, 52, 36, 64),
					toSkinVertices(36, 52, 40, 64),
					toSkinVertices(40, 52, 44, 64),
					toSkinVertices(44, 52, 48, 64)
				);
			}
			let leftArmMesh = new THREE.Mesh(leftArmBox, layer1Material);
			leftArmPivot.add(leftArmMesh);

			let leftArm2Box = new THREE.BoxGeometry((isSlim?3.375:4.5)-esp, 13.5-esp, 4.5-esp, 0, 0, 0);
			if (isSlim) {
				addVertices(leftArm2Box,
					toSkinVertices(52, 48, 55, 52),
					toSkinVertices(55, 48, 58, 52),
					toSkinVertices(48, 52, 52, 64),
					toSkinVertices(52, 52, 55, 64),
					toSkinVertices(55, 52, 59, 64),
					toSkinVertices(59, 52, 62, 64)
				);
			} else {
				addVertices(leftArm2Box,
					toSkinVertices(52, 48, 56, 52),
					toSkinVertices(56, 48, 60, 52),
					toSkinVertices(48, 52, 52, 64),
					toSkinVertices(52, 52, 56, 64),
					toSkinVertices(56, 52, 60, 64),
					toSkinVertices(60, 52, 64, 64)
				);
			}
			let leftArm2Mesh = new THREE.Mesh(leftArm2Box, layer2Material);
			leftArm2Mesh.renderOrder = 1;
			leftArmPivot.add(leftArm2Mesh);

			leftArmPivot.position.y = -6;
			this.leftArm.add(leftArmPivot);
			this.leftArm.position.y = -4;
			this.leftArm.position.x = isSlim?5.5:6;
			this.add(this.leftArm);


			// Right Leg
			this.rightLeg = new THREE.Group();
			let rightLegPivot = new THREE.Group();

			let rightLegBox = new THREE.BoxGeometry(4-esp, 12-esp, 4-esp, 0, 0, 0);
			addVertices(rightLegBox,
				toSkinVertices(4, 16, 8, 20),
				toSkinVertices(8, 16, 12, 20),
				toSkinVertices(0, 20, 4, 32),
				toSkinVertices(4, 20, 8, 32),
				toSkinVertices(8, 20, 12, 32),
				toSkinVertices(12, 20, 16, 32)
			);
			let rightLegMesh = new THREE.Mesh(rightLegBox, layer1Material);
			rightLegPivot.add(rightLegMesh);

			let rightLeg2Box = new THREE.BoxGeometry(4.5-esp, 13.5-esp, 4.5-esp, 0, 0, 0);
			addVertices(rightLeg2Box,
				toSkinVertices(4, 32, 8, 36),
				toSkinVertices(8, 32, 12, 36),
				toSkinVertices(0, 36, 4, 48),
				toSkinVertices(4, 36, 8, 48),
				toSkinVertices(8, 36, 12, 48),
				toSkinVertices(12, 36, 16, 48)
			);
			let rightLeg2Mesh = new THREE.Mesh(rightLeg2Box, layer2Material);
			rightLeg2Mesh.renderOrder = 1;
			rightLegPivot.add(rightLeg2Mesh);

			rightLegPivot.position.y = -6;
			this.rightLeg.add(rightLegPivot);
			this.rightLeg.position.y = -16;
			this.rightLeg.position.x = -2;
			this.add(this.rightLeg);

			// Left Leg
			this.leftLeg = new THREE.Group();
			let leftLegPivot = new THREE.Group();

			let leftLegBox = new THREE.BoxGeometry(4-esp, 12-esp, 4-esp, 0, 0, 0);
			addVertices(leftLegBox,
				toSkinVertices(20, 48, 24, 52),
				toSkinVertices(24, 48, 28, 52),
				toSkinVertices(16, 52, 20, 64),
				toSkinVertices(20, 52, 24, 64),
				toSkinVertices(24, 52, 28, 64),
				toSkinVertices(28, 52, 32, 64)
			);
			let leftLegMesh = new THREE.Mesh(leftLegBox, layer1Material);
			leftLegPivot.add(leftLegMesh);

			let leftLeg2Box = new THREE.BoxGeometry(4.5-esp, 13.5-esp, 4.5-esp, 0, 0, 0);
			addVertices(leftLeg2Box,
				toSkinVertices(4, 48, 8, 52),
				toSkinVertices(8, 48, 12, 52),
				toSkinVertices(0, 52, 4, 64),
				toSkinVertices(4, 52, 8, 64),
				toSkinVertices(8, 52, 12, 64),
				toSkinVertices(12, 52, 16, 64)
			);
			let leftLeg2Mesh = new THREE.Mesh(leftLeg2Box, layer2Material);
			leftLeg2Mesh.renderOrder = 1;
			leftLegPivot.add(leftLeg2Mesh);

			leftLegPivot.position.y = -6;
			this.leftLeg.add(leftLegPivot);
			this.leftLeg.position.y = -16;
			this.leftLeg.position.x = 2;
			this.add(this.leftLeg);
		}
	};

	this.CapeObject = class extends THREE.Group {
		constructor(capeMaterial) {
			super();

			// back = outside
			// front = inside
			let capeBox = new THREE.BoxGeometry(10, 16, 1, 0, 0, 0);
			addVertices(capeBox,
				toCapeVertices(1, 0, 11, 1),
				toCapeVertices(11, 0, 21, 1),
				toCapeVertices(11, 1, 12, 17),
				toCapeVertices(12, 1, 22, 17),
				toCapeVertices(0, 1, 1, 17),
				toCapeVertices(1, 1, 11, 17)
			);
			this.cape = new THREE.Mesh(capeBox, capeMaterial);
			this.cape.position.y = -8;
			this.cape.position.z = -0.5;
			this.add(this.cape);
		}
	};

	this.PlayerObject = class extends THREE.Group {
		constructor(slim, layer1Material, layer2Material, capeMaterial){
			super();

			this.slim = slim;

			this.skin = new skinview3d.SkinObject(slim, layer1Material, layer2Material);
			this.skin.visible = false;
			this.add(this.skin);

			this.cape = new skinview3d.CapeObject(capeMaterial);
			this.cape.position.z = -2;
			this.cape.position.y = -4;
			this.cape.rotation.x = 25*Math.PI/180;
			this.cape.visible = false;
			this.add(this.cape);
		}
	};

	this.WalkAnimation = (player,time) => {
		let skin = player.skin;
		let angleRot = time + Math.PI/2;

		// Leg Swing
		skin.leftLeg.rotation.x = Math.cos(angleRot);
		skin.rightLeg.rotation.x = Math.cos(angleRot + (Math.PI));

		// Arm Swing
		skin.leftArm.rotation.x = Math.cos(angleRot + (Math.PI));
		skin.rightArm.rotation.x = Math.cos(angleRot);
	};

	this.SkinViewer = class {
		constructor(options) {
			this.domElement = options.domElement;
			this.animation = options.animation || null;
			this.animationPaused = false;
			this.animationSpeed = 3;
			this.animationTime = 0;
			this.disposed = false;

			// texture
			this.skinImg = new Image();
			this.skinCanvas = document.createElement("canvas");
			this.skinTexture = new THREE.Texture(this.skinCanvas);
			this.skinTexture.magFilter = THREE.NearestFilter;
			this.skinTexture.minFilter = THREE.NearestMipMapNearestFilter;

			this.capeImg = new Image();
			this.capeCanvas = document.createElement("canvas");
			this.capeTexture = new THREE.Texture(this.capeCanvas);
			this.capeTexture.magFilter = THREE.NearestFilter;
			this.capeTexture.minFilter = THREE.NearestMipMapNearestFilter;

			this.layer1Material = new THREE.MeshBasicMaterial({map: this.skinTexture, side: THREE.FrontSide});
			this.layer2Material = new THREE.MeshBasicMaterial({map: this.skinTexture, transparent: true, opacity: 1, side: THREE.DoubleSide});
			this.capeMaterial = new THREE.MeshBasicMaterial({map: this.capeTexture});

			// scene
			this.scene = new THREE.Scene();

			this.camera = new THREE.PerspectiveCamera(75);
			this.camera.position.y = -12;
			this.camera.position.z = 30;

			this.renderer = new THREE.WebGLRenderer({angleRot: true, alpha: true, antialias: false});
			this.renderer.setSize(300, 300); // default size
			this.renderer.context.getShaderInfoLog = () => ""; // shut firefox up
			this.domElement.appendChild(this.renderer.domElement);

			this.playerObject = new skinview3d.PlayerObject(options.slim === true, this.layer1Material, this.layer2Material, this.capeMaterial);
			this.scene.add(this.playerObject);

			// texture loading
			this.skinImg.crossOrigin = "";
			this.skinImg.onerror = () => console.log("Failed loading " + this.skinImg.src);
			this.skinImg.onload = () => {
				let isOldFormat = false;
				if (this.skinImg.width !== this.skinImg.height) {
					if (this.skinImg.width === 2*this.skinImg.height) {
						isOldFormat = true;
					} else {
						console.log("Bad skin size");
						return;
					}
				}

				let skinContext = this.skinCanvas.getContext("2d");
				if(isOldFormat){
					let width = this.skinImg.width;
					this.skinCanvas.width = width;
					this.skinCanvas.height = width;
					skinContext.clearRect(0, 0, width, width);
					skinContext.drawImage(this.skinImg, 0, 0, width, width/2.0);
					convertSkinTo1_8(skinContext, width);
				} else {
					this.skinCanvas.width = this.skinImg.width;
					this.skinCanvas.height = this.skinImg.height;
					skinContext.clearRect(0, 0, this.skinCanvas.width, this.skinCanvas.height);
					skinContext.drawImage(this.skinImg, 0, 0, this.skinCanvas.width, this.skinCanvas.height);
				}

				this.skinTexture.needsUpdate = true;
				this.layer1Material.needsUpdate = true;
				this.layer2Material.needsUpdate = true;

				this.playerObject.skin.visible = true;
			};

			this.capeImg.crossOrigin = "";
			this.capeImg.onerror = () => console.log("Failed loading " + this.capeImg.src);
			this.capeImg.onload = () => {
				if (this.capeImg.width !== 2*this.capeImg.height) {
					console.log("Bad cape size");
					return;
				}

				this.capeCanvas.width = this.capeImg.width;
				this.capeCanvas.height = this.capeImg.height;
				let capeContext = this.capeCanvas.getContext("2d");
				capeContext.clearRect(0, 0, this.capeCanvas.width, this.capeCanvas.height);
				capeContext.drawImage(this.capeImg, 0, 0, this.capeCanvas.width, this.capeCanvas.height);

				this.capeTexture.needsUpdate = true;
				this.capeMaterial.needsUpdate = true;

				this.playerObject.cape.visible = true;
			};

			if(options.skinUrl) this.skinUrl = options.skinUrl;
			if(options.capeUrl) this.capeUrl = options.capeUrl;
			if(options.width) this.width = options.width;
			if(options.height) this.height = options.height;

			let draw = () => {
				if(this.disposed) return;
				window.requestAnimationFrame(draw);
				if(!this.animationPaused){
					this.animationTime++;
					if(this.animation){
						this.animation(this.playerObject,this.animationTime/100*this.animationSpeed);
					}
				}
				this.renderer.render(this.scene, this.camera);
			};
			draw();
		}

		setSize(width, height){
			this.camera.aspect = width / height;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(width, height);
		}

		dispose() {
			this.disposed = true;
			this.domElement.removeChild(this.renderer.domElement);
			this.renderer.dispose();
			this.skinTexture.dispose();
			this.capeTexture.dispose();
		}

		get skinUrl(){
			return this.skinImg.src;
		}

		set skinUrl(url){
			this.skinImg.src = url;
		}

		get capeUrl(){
			return this.capeImg.src;
		}

		set capeUrl(url){
			this.capeImg.src = url;
		}

		get width(){
			return this.renderer.getSize().width;
		}

		set width(newWidth){
			this.setSize(newWidth, this.height);
		}

		get height(){
			return this.renderer.getSize().height;
		}

		set height(newHeight){
			this.setSize(this.width, newHeight);
		}
	};

	// ====== OrbitControls ======
	// The code was originally from https://github.com/mrdoob/three.js/blob/d45a042cf962e9b1aa9441810ba118647b48aacb/examples/js/controls/OrbitControls.js
	/**
	 * The MIT License
	 *
	 * Copyright (C) 2010-2017 three.js authors
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	 * THE SOFTWARE.
	*/
	this.OrbitControls = function (object, domElement) {
		/**
		 * @author qiao / https://github.com/qiao
		 * @author mrdoob / http://mrdoob.com
		 * @author alteredq / http://alteredqualia.com/
		 * @author WestLangley / http://github.com/WestLangley
		 * @author erich666 / http://erichaines.com
		 */
		// This set of controls performs orbiting, dollying (zooming), and panning.
		// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
		//
		//    Orbit - left mouse / touch: one finger move
		//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
		//    Pan - right mouse, or arrow keys / touch: three finger swipe

		this.object = object;

		this.domElement = (domElement !== undefined) ? domElement : document;

		// Set to false to disable this control
		this.enabled = true;

		// "target" sets the location of focus, where the object orbits around
		this.target = new THREE.Vector3();

		// How far you can dolly in and out (PerspectiveCamera only)
		this.minDistance = 0;
		this.maxDistance = Infinity;

		// How far you can zoom in and out (OrthographicCamera only)
		this.minZoom = 0;
		this.maxZoom = Infinity;

		// How far you can orbit vertically, upper and lower limits.
		// Range is 0 to Math.PI radians.
		this.minPolarAngle = 0; // radians
		this.maxPolarAngle = Math.PI; // radians

		// How far you can orbit horizontally, upper and lower limits.
		// If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
		this.minAzimuthAngle = - Infinity; // radians
		this.maxAzimuthAngle = Infinity; // radians

		// Set to true to enable damping (inertia)
		// If damping is enabled, you must call controls.update() in your animation loop
		this.enableDamping = false;
		this.dampingFactor = 0.25;

		// This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
		// Set to false to disable zooming
		this.enableZoom = true;
		this.zoomSpeed = 1.0;

		// Set to false to disable rotating
		this.enableRotate = true;
		this.rotateSpeed = 1.0;

		// Set to false to disable panning
		this.enablePan = true;
		this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

		// Set to true to automatically rotate around the target
		// If auto-rotate is enabled, you must call controls.update() in your animation loop
		this.autoRotate = false;
		this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

		// Set to false to disable use of the keys
		this.enableKeys = true;

		// The four arrow keys
		this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

		// Mouse buttons
		this.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };

		// for reset
		this.target0 = this.target.clone();
		this.position0 = this.object.position.clone();
		this.zoom0 = this.object.zoom;

		//
		// public methods
		//

		this.getPolarAngle = function () {
			return spherical.phi;
		};

		this.getAzimuthalAngle = function () {
			return spherical.theta;
		};

		this.saveState = function () {
			scope.target0.copy(scope.target);
			scope.position0.copy(scope.object.position);
			scope.zoom0 = scope.object.zoom;
		};

		this.reset = function () {
			scope.target.copy(scope.target0);
			scope.object.position.copy(scope.position0);
			scope.object.zoom = scope.zoom0;

			scope.object.updateProjectionMatrix();
			scope.dispatchEvent(changeEvent);

			scope.update();

			state = STATE.NONE;
		};

		// this method is exposed, but perhaps it would be better if we can make it private...
		this.update = function () {
			let offset = new THREE.Vector3();

			// so camera.up is the orbit axis
			let quat = new THREE.Quaternion().setFromUnitVectors(object.up, new THREE.Vector3(0, 1, 0));
			let quatInverse = quat.clone().inverse();

			let lastPosition = new THREE.Vector3();
			let lastQuaternion = new THREE.Quaternion();

			return function update() {

				let position = scope.object.position;

				offset.copy(position).sub(scope.target);

				// rotate offset to "y-axis-is-up" space
				offset.applyQuaternion(quat);

				// angle from z-axis around y-axis
				spherical.setFromVector3(offset);

				if (scope.autoRotate && state === STATE.NONE) {

					rotateLeft(getAutoRotationAngle());

				}

				spherical.theta += sphericalDelta.theta;
				spherical.phi += sphericalDelta.phi;

				// restrict theta to be between desired limits
				spherical.theta = Math.max(scope.minAzimuthAngle, Math.min(scope.maxAzimuthAngle, spherical.theta));

				// restrict phi to be between desired limits
				spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));

				spherical.makeSafe();

				spherical.radius *= scale;

				// restrict radius to be between desired limits
				spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius));

				// move target to panned location
				scope.target.add(panOffset);

				offset.setFromSpherical(spherical);

				// rotate offset back to "camera-up-vector-is-up" space
				offset.applyQuaternion(quatInverse);

				position.copy(scope.target).add(offset);

				scope.object.lookAt(scope.target);

				if (scope.enableDamping === true) {

					sphericalDelta.theta *= (1 - scope.dampingFactor);
					sphericalDelta.phi *= (1 - scope.dampingFactor);

				} else {

					sphericalDelta.set(0, 0, 0);

				}

				scale = 1;
				panOffset.set(0, 0, 0);

				// update condition is:
				// min(camera displacement, camera rotation in radians)^2 > EPS
				// using small-angle approximation cos(x/2) = 1 - x^2 / 8

				if (zoomChanged ||
					lastPosition.distanceToSquared(scope.object.position) > EPS ||
					8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS) {

					scope.dispatchEvent(changeEvent);

					lastPosition.copy(scope.object.position);
					lastQuaternion.copy(scope.object.quaternion);
					zoomChanged = false;

					return true;
				}
				return false;
			};
		}();

		this.dispose = function () {
			scope.domElement.removeEventListener("contextmenu", onContextMenu, false);
			scope.domElement.removeEventListener("mousedown", onMouseDown, false);
			scope.domElement.removeEventListener("wheel", onMouseWheel, false);

			scope.domElement.removeEventListener("touchstart", onTouchStart, false);
			scope.domElement.removeEventListener("touchend", onTouchEnd, false);
			scope.domElement.removeEventListener("touchmove", onTouchMove, false);

			document.removeEventListener("mousemove", onMouseMove, false);
			document.removeEventListener("mouseup", onMouseUp, false);

			window.removeEventListener("keydown", onKeyDown, false);

			//scope.dispatchEvent({ type: "dispose" }); // should this be added here?
		};

		//
		// internals
		//

		let scope = this;

		let changeEvent = { type: "change" };
		let startEvent = { type: "start" };
		let endEvent = { type: "end" };

		let STATE = { NONE: - 1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_DOLLY: 4, TOUCH_PAN: 5 };

		let state = STATE.NONE;

		let EPS = 0.000001;

		// current position in spherical coordinates
		let spherical = new THREE.Spherical();
		let sphericalDelta = new THREE.Spherical();

		let scale = 1;
		let panOffset = new THREE.Vector3();
		let zoomChanged = false;

		let rotateStart = new THREE.Vector2();
		let rotateEnd = new THREE.Vector2();
		let rotateDelta = new THREE.Vector2();

		let panStart = new THREE.Vector2();
		let panEnd = new THREE.Vector2();
		let panDelta = new THREE.Vector2();

		let dollyStart = new THREE.Vector2();
		let dollyEnd = new THREE.Vector2();
		let dollyDelta = new THREE.Vector2();

		function getAutoRotationAngle() {
			return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
		}

		function getZoomScale() {
			return Math.pow(0.95, scope.zoomSpeed);
		}

		function rotateLeft(angle) {
			sphericalDelta.theta -= angle;
		}

		function rotateUp(angle) {
			sphericalDelta.phi -= angle;
		}

		let panLeft = function () {
			let v = new THREE.Vector3();
			return function panLeft(distance, objectMatrix) {
				v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
				v.multiplyScalar(- distance);

				panOffset.add(v);
			};
		}();

		let panUp = function () {
			let v = new THREE.Vector3();
			return function panUp(distance, objectMatrix) {
				v.setFromMatrixColumn(objectMatrix, 1); // get Y column of objectMatrix
				v.multiplyScalar(distance);

				panOffset.add(v);
			};
		}();

		// deltaX and deltaY are in pixels; right and down are positive
		let pan = function () {
			let offset = new THREE.Vector3();
			return function pan(deltaX, deltaY) {
				let element = scope.domElement === document ? scope.domElement.body : scope.domElement;
				if (scope.object instanceof THREE.PerspectiveCamera) {
					// perspective
					let position = scope.object.position;
					offset.copy(position).sub(scope.target);
					let targetDistance = offset.length();

					// half of the fov is center to top of screen
					targetDistance *= Math.tan((scope.object.fov / 2) * Math.PI / 180.0);

					// we actually don't use screenWidth, since perspective camera is fixed to screen height
					panLeft(2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix);
					panUp(2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix);
				} else if (scope.object instanceof THREE.OrthographicCamera) {
					// orthographic
					panLeft(deltaX * (scope.object.right - scope.object.left) / scope.object.zoom / element.clientWidth, scope.object.matrix);
					panUp(deltaY * (scope.object.top - scope.object.bottom) / scope.object.zoom / element.clientHeight, scope.object.matrix);
				} else {
					// camera neither orthographic nor perspective
					console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.");
					scope.enablePan = false;
				}
			};
		}();

		function dollyIn(dollyScale) {
			if (scope.object instanceof THREE.PerspectiveCamera) {
				scale /= dollyScale;
			} else if (scope.object instanceof THREE.OrthographicCamera) {
				scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom * dollyScale));
				scope.object.updateProjectionMatrix();
				zoomChanged = true;
			} else {
				console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.");
				scope.enableZoom = false;
			}
		}

		function dollyOut(dollyScale) {
			if (scope.object instanceof THREE.PerspectiveCamera) {
				scale *= dollyScale;
			} else if (scope.object instanceof THREE.OrthographicCamera) {
				scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom / dollyScale));
				scope.object.updateProjectionMatrix();
				zoomChanged = true;
			} else {
				console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.");
				scope.enableZoom = false;
			}
		}

		//
		// event callbacks - update the object state
		//

		function handleMouseDownRotate(event) {
			rotateStart.set(event.clientX, event.clientY);

		}

		function handleMouseDownDolly(event) {
			dollyStart.set(event.clientX, event.clientY);

		}

		function handleMouseDownPan(event) {
			panStart.set(event.clientX, event.clientY);

		}

		function handleMouseMoveRotate(event) {
			rotateEnd.set(event.clientX, event.clientY);
			rotateDelta.subVectors(rotateEnd, rotateStart);
			let element = scope.domElement === document ? scope.domElement.body : scope.domElement;
			// rotating across whole screen goes 360 degrees around
			rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed);
			// rotating up and down along whole screen attempts to go 360, but limited to 180
			rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed);
			rotateStart.copy(rotateEnd);
			scope.update();
		}

		function handleMouseMoveDolly(event) {
			dollyEnd.set(event.clientX, event.clientY);
			dollyDelta.subVectors(dollyEnd, dollyStart);
			if (dollyDelta.y > 0) {
				dollyIn(getZoomScale());
			} else if (dollyDelta.y < 0) {
				dollyOut(getZoomScale());
			}
			dollyStart.copy(dollyEnd);
			scope.update();
		}

		function handleMouseMovePan(event) {
			panEnd.set(event.clientX, event.clientY);
			panDelta.subVectors(panEnd, panStart);
			pan(panDelta.x, panDelta.y);
			panStart.copy(panEnd);
			scope.update();
		}

		function handleMouseUp(event) {
		}

		function handleMouseWheel(event) {
			if (event.deltaY < 0) {
				dollyOut(getZoomScale());
			} else if (event.deltaY > 0) {
				dollyIn(getZoomScale());
			}
			scope.update();
		}

		function handleKeyDown(event) {
			switch (event.keyCode) {
				case scope.keys.UP:
					pan(0, scope.keyPanSpeed);
					scope.update();
					break;

				case scope.keys.BOTTOM:
					pan(0, - scope.keyPanSpeed);
					scope.update();
					break;

				case scope.keys.LEFT:
					pan(scope.keyPanSpeed, 0);
					scope.update();
					break;

				case scope.keys.RIGHT:
					pan(- scope.keyPanSpeed, 0);
					scope.update();
					break;
			}

		}

		function handleTouchStartRotate(event) {
			rotateStart.set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);

		}

		function handleTouchStartDolly(event) {
			let dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
			let dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
			let distance = Math.sqrt(dx * dx + dy * dy);
			dollyStart.set(0, distance);
		}

		function handleTouchStartPan(event) {
			panStart.set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);
		}

		function handleTouchMoveRotate(event) {
			rotateEnd.set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);
			rotateDelta.subVectors(rotateEnd, rotateStart);
			let element = scope.domElement === document ? scope.domElement.body : scope.domElement;
			rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed);
			rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed);
			rotateStart.copy(rotateEnd);
			scope.update();

		}

		function handleTouchMoveDolly(event) {
			let dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
			let dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
			let distance = Math.sqrt(dx * dx + dy * dy);
			dollyEnd.set(0, distance);
			dollyDelta.subVectors(dollyEnd, dollyStart);
			if (dollyDelta.y > 0) {
				dollyOut(getZoomScale());
			} else if (dollyDelta.y < 0) {
				dollyIn(getZoomScale());
			}
			dollyStart.copy(dollyEnd);
			scope.update();

		}

		function handleTouchMovePan(event) {
			panEnd.set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);
			panDelta.subVectors(panEnd, panStart);
			pan(panDelta.x, panDelta.y);
			panStart.copy(panEnd);
			scope.update();
		}

		function handleTouchEnd(event) {
		}

		//
		// event handlers - FSM: listen for events and reset state
		//

		function onMouseDown(event) {
			if (scope.enabled === false) return;
			switch (event.button) {
				case scope.mouseButtons.ORBIT:
					if (scope.enableRotate === false) return;
					handleMouseDownRotate(event);
					state = STATE.ROTATE;
					break;

				case scope.mouseButtons.ZOOM:
					if (scope.enableZoom === false) return;
					handleMouseDownDolly(event);
					state = STATE.DOLLY;
					break;

				case scope.mouseButtons.PAN:
					if (scope.enablePan === false) return;
					handleMouseDownPan(event);
					state = STATE.PAN;
					break;
			}

			event.preventDefault();
			if (state !== STATE.NONE) {
				document.addEventListener("mousemove", onMouseMove, false);
				document.addEventListener("mouseup", onMouseUp, false);
				scope.dispatchEvent(startEvent);
			}
		}

		function onMouseMove(event) {
			if (scope.enabled === false) return;
			switch (state) {
				case STATE.ROTATE:
					if (scope.enableRotate === false) return;
					handleMouseMoveRotate(event);
					break;

				case STATE.DOLLY:
					if (scope.enableZoom === false) return;
					handleMouseMoveDolly(event);
					break;

				case STATE.PAN:
					if (scope.enablePan === false) return;
					handleMouseMovePan(event);
					break;
			}
			event.preventDefault();
		}

		function onMouseUp(event) {
			if (scope.enabled === false) return;
			handleMouseUp(event);
			document.removeEventListener("mousemove", onMouseMove, false);
			document.removeEventListener("mouseup", onMouseUp, false);
			scope.dispatchEvent(endEvent);
			state = STATE.NONE;
		}

		function onMouseWheel(event) {
			if (scope.enabled === false || scope.enableZoom === false || (state !== STATE.NONE && state !== STATE.ROTATE)) return;
			event.preventDefault();
			event.stopPropagation();
			handleMouseWheel(event);
			scope.dispatchEvent(startEvent); // not sure why these are here...
			scope.dispatchEvent(endEvent);
		}

		function onKeyDown(event) {
			if (scope.enabled === false || scope.enableKeys === false || scope.enablePan === false) return;
			handleKeyDown(event);
		}

		function onTouchStart(event) {
			if (scope.enabled === false) return;
			switch (event.touches.length) {
				case 1:	// one-fingered touch: rotate
					if (scope.enableRotate === false) return;
					handleTouchStartRotate(event);
					state = STATE.TOUCH_ROTATE;
					break;

				case 2:	// two-fingered touch: dolly
					if (scope.enableZoom === false) return;
					handleTouchStartDolly(event);
					state = STATE.TOUCH_DOLLY;
					break;

				case 3: // three-fingered touch: pan
					if (scope.enablePan === false) return;
					handleTouchStartPan(event);
					state = STATE.TOUCH_PAN;
					break;

				default:
					state = STATE.NONE;
			}

			if (state !== STATE.NONE) {
				scope.dispatchEvent(startEvent);
			}

		}

		function onTouchMove(event) {
			if (scope.enabled === false) return;
			switch (event.touches.length) {
				case 1: // one-fingered touch: rotate
					if (scope.enableRotate === false) return;
					if (state !== STATE.TOUCH_ROTATE) return; // is this needed?...
					handleTouchMoveRotate(event);
					break;

				case 2: // two-fingered touch: dolly
					if (scope.enableZoom === false) return;
					if (state !== STATE.TOUCH_DOLLY) return; // is this needed?...
					handleTouchMoveDolly(event);
					break;

				case 3: // three-fingered touch: pan
					if (scope.enablePan === false) return;
					if (state !== STATE.TOUCH_PAN) return; // is this needed?...
					handleTouchMovePan(event);
					break;

				default:
					state = STATE.NONE;
			}
			event.preventDefault();
			event.stopPropagation();
		}

		function onTouchEnd(event) {
			if (scope.enabled === false) return;
			handleTouchEnd(event);
			scope.dispatchEvent(endEvent);
			state = STATE.NONE;
		}

		function onContextMenu(event) {
			if (scope.enabled === false || scope.enablePan === false) return;
			event.preventDefault();
		}

		//

		scope.domElement.addEventListener("contextmenu", onContextMenu, false);

		scope.domElement.addEventListener("mousedown", onMouseDown, false);
		scope.domElement.addEventListener("wheel", onMouseWheel, false);

		scope.domElement.addEventListener("touchstart", onTouchStart, false);
		scope.domElement.addEventListener("touchend", onTouchEnd, false);
		scope.domElement.addEventListener("touchmove", onTouchMove, false);

		window.addEventListener("keydown", onKeyDown, false);

		// force an update at start

		this.update();
	};

	this.OrbitControls.prototype = Object.create(THREE.EventDispatcher.prototype);
	this.OrbitControls.prototype.constructor = this.OrbitControls;
	// ============

	this.SkinControl = class {
		constructor(skinViewer) {
			this.enableAnimationControl = true;
			this.skinViewer = skinViewer;

			this.orbitControls = new skinview3d.OrbitControls(skinViewer.camera, skinViewer.renderer.domElement);
			this.orbitControls.enablePan = false;
			this.orbitControls.target = new THREE.Vector3(0, -12 ,0);
			this.orbitControls.minDistance = 10;
			this.orbitControls.maxDistance = 256;
			this.orbitControls.update();

			this.animationPauseListener = e => {
				if(this.enableAnimationControl) {
					e.preventDefault();
					this.skinViewer.animationPaused = !this.skinViewer.animationPaused;
				}
			};
			this.skinViewer.domElement.addEventListener("contextmenu", this.animationPauseListener, false);
		}

		dispose(){
			this.skinViewer.domElement.removeEventListener("contextmenu", this.animationPauseListener, false);
			this.orbitControls.dispose();
		}
	};

}();