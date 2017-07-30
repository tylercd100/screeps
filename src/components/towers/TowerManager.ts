
import * as Config from "./../../config/config";

export class TowerManager {
    towers: Tower[];
    towerCount: number = 0;

    run(room: Room): void {
        this.towers = room.find<Tower>(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_TOWER }
        })

        _.forEach(this.towers, function(tower){
            let closestEnemy = tower.pos.findClosestByRange<Creep>(FIND_CREEPS, {
                filter: function (creep: Creep) {
                    return _.indexOf(Config.FRIENDS, creep.owner.username) < 0;
                }
            });
            let closestFriend = tower.pos.findClosestByRange<Creep>(FIND_CREEPS, {
                filter: function (creep: Creep) {
                    return _.indexOf(Config.FRIENDS, creep.owner.username) >= 0 && creep.hits < creep.hitsMax;
                }
            });
            if(closestEnemy) {
                tower.attack(closestEnemy);
            } else if(closestFriend) {
                tower.heal(closestFriend);
            } else if(tower.energy > 200) {
                let priority = [
                    {structureType: STRUCTURE_CONTAINER, percentage: 1},
                    {structureType: STRUCTURE_ROAD, percentage: 1},
                    {structureType: STRUCTURE_RAMPART, percentage: 0.0003},
                    {structureType: STRUCTURE_WALL, percentage: 0.0003},
                ];

                let target = null;
                _.forEach(priority, function (options) {
                    if (!target) {
                        target = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                            filter: function (x) {
                                return x.structureType === options.structureType && x.hits / x.hitsMax < options.percentage;
                            }
                        })
                    }
                });

                if (target) {
                    tower.repair(target);
                }
            }
        });
    }
}
