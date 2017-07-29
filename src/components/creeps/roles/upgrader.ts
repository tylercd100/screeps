import * as creepActions from "../creepActions";

/**
 * Runs all creep actions.
 *
 * @export
 * @param {Creep} creep
 */
export function run(creep: Creep): void {
  const controller = creep.room.controller;
  const spawn = creep.room.find<Spawn>(FIND_MY_SPAWNS)[0];
  const energySource = creep.pos.findClosestByRange<Source>(FIND_SOURCES_ACTIVE);

  if(_.sum(creep.carry) === creep.carryCapacity) {
    creep.memory.working = true;
  }
  if(_.sum(creep.carry) === 0) {
    creep.memory.working = false;
  }

  if (creepActions.needsRenew(creep)) {
    creepActions.moveToRenew(creep, spawn);
  } else if (creep.memory.working) {
    _moveToUpgrade(creep, controller);
  } else if (!creep.memory.working) {
    _moveToHarvest(creep, energySource);
  }
}

function _tryHarvest(creep: Creep, target: Source): number {
  return creep.harvest(target);
}

function _moveToHarvest(creep: Creep, target: Source): void {
  if (_tryHarvest(creep, target) === ERR_NOT_IN_RANGE) {
    creepActions.moveTo(creep, target.pos);
  }
}

function _tryEnergyDropOff(creep: Creep, target: Spawn | Structure): number {
  return creep.transfer(target, RESOURCE_ENERGY);
}

function _moveToUpgrade(creep: Creep, target: StructureController): void {
  if (_tryEnergyDropOff(creep, target) === ERR_NOT_IN_RANGE) {
    creepActions.moveTo(creep, target.pos);
  }
}
