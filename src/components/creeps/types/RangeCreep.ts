/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:52:14
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-05 01:13:30
*/

'use strict';

import {Task, GotoRoomTask, RangedAttackTask, GotoTargetTask} from "./../tasks/Tasks";
import {BaseCreep} from "./BaseCreep";
import * as Config from "./../../../config/config";
import {Nest} from "./../../nest/Nest";

export class RangeCreep extends BaseCreep {
    protected handle(task: Task): Task {

        let creep = this.creep;

        let station = creep.memory.station

        if(station) {
            if (creep.room.name === station) {

                let enemyCreepNonHeal = creep.pos.findClosestByRange<Creep>(FIND_HOSTILE_CREEPS, {
                    filter: function (creep: Creep) {
                        return _.indexOf(Config.FRIENDS, creep.owner.username) < 0 && !_.find(creep.body, {type:HEAL});
                    }
                })

                let enemyCreepHeal = creep.pos.findClosestByRange<Creep>(FIND_HOSTILE_CREEPS, {
                    filter: function (creep: Creep) {
                        return _.indexOf(Config.FRIENDS, creep.owner.username) < 0 && _.find(creep.body, {type:HEAL});
                    }
                })

                let enemySpawn = creep.pos.findClosestByRange<Spawn>(FIND_HOSTILE_SPAWNS);

                if ((enemyCreepNonHeal || enemyCreepHeal || enemySpawn) && _.get(creep, "room.controller.safeMode", 0) === 0) {
                    if (enemyCreepHeal) {
                        task = new RangedAttackTask(enemyCreepHeal);
                    } else if (enemyCreepNonHeal) {
                        task = new RangedAttackTask(enemyCreepNonHeal);
                    } else if(enemySpawn) {
                        task = new RangedAttackTask(enemySpawn);
                    } else {
                        task = new GotoTargetTask(new RoomPosition(24, 24, creep.memory.station));
                    }
                    if(creep.pos.x === 0 || creep.pos.y ===0 || creep.pos.x === 49 || creep.pos.y ===49) {
                        creep.move(creep.pos.getDirectionTo(24,24));
                    }
                } else if(!task) {
                    let target = this.getFlag("Rally");
                    if(!target) {
                        target = new RoomPosition(24, 24, creep.memory.station);
                    }
                    if(!target) {
                        target = this.getClosestSpawn();
                    }

                    if(target) {
                        if(target.pos.getRangeTo(creep.pos) > 2) {
                            task = new GotoTargetTask(target)
                        }
                    } else {
                        creep.move(creep.pos.getDirectionTo(24, 24));
                    }
                }
            } else if(!task) {
                task = new GotoRoomTask(station);
            }
        }

        return task;
    }

    protected draw() {
        this.creep.room.visual.circle(this.creep.pos, {fill: 'transparent', radius: 0.55, stroke: 'red'});
    }

    static type: string = "range";

    static createCreep(spawn: Spawn, nest: Nest, level: number = 1): string|number|null {
        const body = RangeCreep.getBody(level);
        const name = RangeCreep.getName();
        const memory = RangeCreep.getMemory(nest);
        return spawn.createCreep(body, name, memory);
    }

    static getMemory(nest: Nest): {[key: string]: any} {
        return _.merge(BaseCreep.getMemory(nest), {
            type: RangeCreep.type,
        });
    }

    static getName(): string {
        return RangeCreep.type+"-"+BaseCreep.getName();
    }

    /**
     * MOVE          50
     * WORK          100
     * CARRY         50
     * ATTACK        80
     * RANGED_ATTACK 150
     * HEAL          250
     * CLAIM         600
     * TOUGH         10
     * @param  {Room}     room [description]
     * @return {string[]}      [description]
     */
    static getBody(level: number): string[] {
        switch (level) {
            case 1: // 300
            case 2: // 550
                return [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, RANGED_ATTACK];
            case 3: // 800
            case 4:
            default:
                return [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK];
        }
    }
}
