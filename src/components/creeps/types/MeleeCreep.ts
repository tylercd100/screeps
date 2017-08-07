/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:52:14
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-06 11:41:04
*/

'use strict';

import {Task, GotoRoomTask, AttackTask} from "./../tasks/Tasks";
import {BaseCreep} from "./BaseCreep";
import * as Config from "./../../../config/config";
import {Nest} from "./../../nest/Nest";

export class MeleeCreep extends BaseCreep {
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
                let enemyTower = creep.pos.findClosestByRange<Creep>(FIND_STRUCTURES, {filter: (s) => s.structureType===STRUCTURE_TOWER})
                let enemySpawn = creep.pos.findClosestByRange<Spawn>(FIND_HOSTILE_SPAWNS);
                let enemyBarrier = _.first(creep.pos.findInRange<StructureRampart>(FIND_STRUCTURES, 10, {filter: (s) => s.structureType===STRUCTURE_RAMPART}));

                let target = null;
                if(enemyBarrier && enemySpawn) {
                    target = enemyBarrier;
                } else if(enemyTower && enemySpawn) {
                    target = enemyTower;
                } else if (enemyCreepHeal) {
                    target = enemyCreepHeal;
                } else if (enemyCreepNonHeal) {
                    target = enemyCreepNonHeal;
                } else if(enemySpawn) {
                    target = enemySpawn;
                }

                if (target && _.get(creep, "room.controller.safeMode", 0) === 0) {
                    task = new AttackTask(target);
                } else if(!task) {
                    task = this.gotoRally();
                }

                if(creep.pos.x === 0 || creep.pos.y ===0 || creep.pos.x === 49 || creep.pos.y ===49) {
                    creep.move(creep.pos.getDirectionTo(24,24));
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

    static type: string = "melee";

    static createCreep(spawn: Spawn, nest: Nest, level: number = 1): string|number|null {
        const body = MeleeCreep.getBody(level);
        const name = MeleeCreep.getName();
        const memory = MeleeCreep.getMemory(nest);
        return spawn.createCreep(body, name, memory);
    }

    static getMemory(nest: Nest): {[key: string]: any} {
        return _.merge(BaseCreep.getMemory(nest), {
            type: MeleeCreep.type,
        });
    }

    static getName(): string {
        return MeleeCreep.type+"-"+BaseCreep.getName();
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
                return [TOUGH, TOUGH, TOUGH, TOUGH, ATTACK, ATTACK, MOVE, MOVE];
            case 2: // 550
            case 3: // 800
            case 4:
            default:
                return [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, ATTACK, ATTACK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        }
    }
}
