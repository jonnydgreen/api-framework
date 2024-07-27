// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

// import "npm:reflect-metadata";
// import { Container } from "npm:inversify";
// import { register, Registration } from "../kernel.ts";

// interface IKatana {
//   hit(): string;
// }

// class Katana implements IKatana {
//   public hit() {
//     return "cut!";
//   }
// }

// class Shuriken {
//   public throw() {
//     return "throw!";
//   }
// }

// class Ninja {
//   private _katana: IKatana;
//   private _shuriken: Shuriken;

//   public constructor(katana: IKatana, shuriken: Shuriken) {
//     this._katana = katana;
//     this._shuriken = shuriken;
//   }

//   public fight() {
//     return this._katana.hit();
//   }
//   public sneak() {
//     return this._shuriken.throw();
//   }
// }

// type Registrations = Record<
//   string,
//   Record<string, Registration>
// >;
// export const TYPES = {
//   Warrior: {
//     Ninja: { key: Symbol("Ninja"), target: Ninja },
//   },
//   Weapon: {
//     Katana: { key: Symbol("Katana"), target: Katana },
//     Shuriken: { key: Symbol("Shuriken"), target: Shuriken },
//   },
// } satisfies Registrations;

// const kernel = new Container();
// register(kernel, TYPES.Weapon.Katana);
// register(kernel, TYPES.Weapon.Shuriken);
// register(
//   kernel,
//   TYPES.Warrior.Ninja,
//   TYPES.Weapon.Katana,
//   TYPES.Weapon.Shuriken,
// );

// const ninja = kernel.get<Ninja>(TYPES.Warrior.Ninja.key);
// console.log(ninja, ninja.fight(), ninja.sneak());

// const katana = kernel.get<Katana>(TYPES.Weapon.Katana.key);
// console.log(katana, katana.hit());

// const shuriken = kernel.get<Shuriken>(TYPES.Weapon.Shuriken.key);
// console.log(shuriken, shuriken.throw());
