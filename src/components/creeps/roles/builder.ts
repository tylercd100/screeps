import * as creepActions from "../creepActions";

/**
 * Runs all creep actions.
 *
 * @export
 * @param {Creep} creep
 */
export function run(creep: Creep): void {
  const site = creep.pos.findClosestByRange<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES);
  const repair = creep.pos.findClosestByRange<Structure>(FIND_STRUCTURES, {
      filter: (structure: Structure) => {
        return structure.hits < structure.hitsMax * 0.75 && structure.structureType !== STRUCTURE_WALL;
      }
  });
  // const rep = creep.pos.findClosestByRange<Structure>(FIND_MY_CONSTRUCTION_SITES);
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
  } else if (!creep.memory.working) {
    _moveToHarvest(creep, energySource);
  } else if (creep.memory.working) {
    if (repair) {
      _moveToRepair(creep, repair);
    } else {
      _moveToBuild(creep, site);
    }
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

function _tryBuild(creep: Creep, target: ConstructionSite): number {
  return creep.build(target);
}

function _moveToBuild(creep: Creep, target: ConstructionSite): void {
  if (_tryBuild(creep, target) === ERR_NOT_IN_RANGE) {
    creepActions.moveTo(creep, target.pos);
  }
}

function _tryRepair(creep: Creep, target: Structure): number {
  return creep.repair(target)
}

function _moveToRepair(creep: Creep, target: Structure): void {
  if (_tryRepair(creep, target) === ERR_NOT_IN_RANGE) {
    creepActions.moveTo(creep, target.pos);
  }
}
