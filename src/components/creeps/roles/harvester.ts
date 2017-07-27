import * as creepActions from "../creepActions";

/**
 * Runs all creep actions.
 *
 * @export
 * @param {Creep} creep
 */
export function run(creep: Creep): void {
  const spawn = creep.room.find<Spawn>(FIND_MY_SPAWNS)[0];
  const energySource = creep.pos.findClosestByRange<Source>(FIND_SOURCES_ACTIVE);
  const targets = creep.room.find<Structure>(FIND_STRUCTURES, {
      filter: (structure: Structure) => {
          const match = (
              structure.structureType === STRUCTURE_CONTAINER ||
              structure.structureType === STRUCTURE_EXTENSION ||
              structure.structureType === STRUCTURE_SPAWN ||
              structure.structureType === STRUCTURE_TOWER) && (structure.energy < structure.energyCapacity);
          return match;
      }
  });

  if(_.sum(creep.carry) === creep.carryCapacity) {
    creep.memory.working = true;
  }
  if(_.sum(creep.carry) === 0) {
    creep.memory.working = false;
  }

  if (creepActions.needsRenew(creep)) {
    creepActions.moveToRenew(creep, spawn);
  } else if (creep.memory.working) {
    _moveToDropEnergy(creep, targets[0]);
  } else if (!creep.memory.working) {
    _moveToHarvest(creep, energySource);
  } else {
    creepActions.moveTo(creep, spawn.pos);
  }
}

function _tryHarvest(creep: Creep, target: Source): number {
  return creep.harvest(target);
}

function _moveToHarvest(creep: Creep, target: Source): void {
  if (_tryHarvest(creep, target) < 0) {
    creepActions.moveTo(creep, target.pos);
  }
}

function _tryEnergyDropOff(creep: Creep, target: Spawn | Structure): number {
  return creep.transfer(target, RESOURCE_ENERGY);
}

function _moveToDropEnergy(creep: Creep, target: Spawn | Structure): void {
  if (_tryEnergyDropOff(creep, target) < 0) {
    creepActions.moveTo(creep, target.pos);
  }
}
