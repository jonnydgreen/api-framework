// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import "npm:reflect-metadata";
import { Container } from "npm:inversify";
import { register } from "./kernel.ts";

interface IKatana {
  hit(): string;
}

class Katana implements IKatana {
  public hit() {
    return "cut!";
  }
}

class Shuriken {
  public throw() {
    return "throw!";
  }
}

class Ninja {
  private _katana: IKatana;
  private _shuriken: Shuriken;

  public constructor(katana: IKatana, shuriken: Shuriken) {
    this._katana = katana;
    this._shuriken = shuriken;
  }

  public fight() {
    return this._katana.hit();
  }
  public sneak() {
    return this._shuriken.throw();
  }
}

export const TYPES = {
  Warrior: {
    Ninja: Symbol.for("Ninja"),
  },
  Weapon: {
    Katana: Symbol.for("Katana"),
    Shuriken: Symbol.for("Shuriken"),
  },
};

const kernel = new Container();
register(kernel, TYPES.Weapon.Katana, Katana);
register(kernel, TYPES.Weapon.Shuriken, Shuriken);
register(
  kernel,
  TYPES.Warrior.Ninja,
  Ninja,
  TYPES.Weapon.Katana,
  TYPES.Weapon.Shuriken,
);

const ninja = kernel.get<Ninja>(TYPES.Warrior.Ninja);
console.log(ninja, ninja.fight(), ninja.sneak());

const katana = kernel.get<Katana>(TYPES.Weapon.Katana);
console.log(katana, katana.hit());

const shuriken = kernel.get<Shuriken>(TYPES.Weapon.Shuriken);
console.log(shuriken, shuriken.throw());
