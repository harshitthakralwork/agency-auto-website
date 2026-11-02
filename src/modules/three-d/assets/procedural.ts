import * as THREE from "three";
import { ThreeDObjectType } from "../types";

export interface ProceduralArchetypeOptions {
  wireframe?: boolean;
  color?: string;
  roughness?: number;
  metalness?: number;
}

export class Procedural3DArchetypes {
  /**
   * Generates a genuine procedural 3D Mesh or Group for a given archetype.
   */
  static create(
    type: ThreeDObjectType,
    options: ProceduralArchetypeOptions = {}
  ): THREE.Object3D {
    const wireframe = options.wireframe ?? false;
    const baseColor = new THREE.Color(options.color || "#6366f1");
    const roughness = options.roughness ?? 0.2;
    const metalness = options.metalness ?? 0.8;

    const group = new THREE.Group();
    group.name = `archetype_${type}`;

    switch (type) {
      case "product_model": {
        // Luxury Cosmetic / Glass Perfume Bottle Archetype
        // 1. Base bottle body (faceted cylinder)
        const bodyGeo = new THREE.CylinderGeometry(0.8, 0.85, 1.8, 8);
        const bodyMat = new THREE.MeshPhysicalMaterial({
          color: baseColor,
          roughness: 0.1,
          metalness: 0.1,
          transmission: wireframe ? 0 : 0.85,
          thickness: 1.2,
          transparent: true,
          opacity: wireframe ? 1 : 0.9,
          wireframe,
        });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        group.add(bodyMesh);

        // 2. Metallic cap
        const capGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.5, 16);
        const capMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color("#fbbf24"), // Gold accent
          roughness: 0.15,
          metalness: 0.95,
          wireframe,
        });
        const capMesh = new THREE.Mesh(capGeo, capMat);
        capMesh.position.y = 1.15;
        capMesh.castShadow = true;
        group.add(capMesh);
        break;
      }

      case "hero_floating_object": {
        // High-precision Torus Knot
        const geo = new THREE.TorusKnotGeometry(0.9, 0.28, 128, 32, 2, 3);
        const mat = new THREE.MeshStandardMaterial({
          color: baseColor,
          roughness,
          metalness,
          wireframe,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
        break;
      }

      case "spatial_environment": {
        // Spatial architectural grid enclosure
        const floorGeo = new THREE.PlaneGeometry(8, 8, 16, 16);
        const floorMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color("#0f172a"),
          roughness: 0.8,
          metalness: 0.2,
          wireframe,
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1;
        floor.receiveShadow = true;
        group.add(floor);

        // Floating geometric pedestals
        for (let i = -1; i <= 1; i += 2) {
          const colGeo = new THREE.BoxGeometry(0.5, 1.5, 0.5);
          const colMat = new THREE.MeshStandardMaterial({
            color: baseColor,
            roughness: 0.3,
            metalness: 0.7,
            wireframe,
          });
          const col = new THREE.Mesh(colGeo, colMat);
          col.position.set(i * 1.5, -0.25, -0.5);
          col.castShadow = true;
          col.receiveShadow = true;
          group.add(col);
        }
        break;
      }

      case "interactive_particles": {
        // 3D Cyber Particle Sphere (1500 points)
        const particleCount = 1500;
        const positions = new Float32Array(particleCount * 3);
        const radius = 1.6;

        for (let i = 0; i < particleCount; i++) {
          const u = Math.random();
          const v = Math.random();
          const theta = u * 2.0 * Math.PI;
          const phi = Math.acos(2.0 * v - 1.0);
          const r = Math.cbrt(Math.random()) * radius;

          const sinPhi = Math.sin(phi);
          positions[i * 3] = r * sinPhi * Math.cos(theta);
          positions[i * 3 + 1] = r * sinPhi * Math.sin(theta);
          positions[i * 3 + 2] = r * Math.cos(phi);
        }

        const particleGeo = new THREE.BufferGeometry();
        particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

        const particleMat = new THREE.PointsMaterial({
          color: baseColor,
          size: 0.035,
          transparent: true,
          opacity: 0.85,
        });

        const points = new THREE.Points(particleGeo, particleMat);
        group.add(points);
        break;
      }

      case "none":
      default:
        // Intentionally empty
        break;
    }

    return group;
  }
}
