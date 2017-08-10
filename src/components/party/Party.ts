/*
* @Author: Tyler Arbon
* @Date:   2017-08-09 17:58:52
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-09 20:34:14
*/

'use strict';

import {Serializable, SerialRaw} from "./../traits";

export class Party extends Serializable {
	constructor(protected _name: string, protected _creeps: Creep[]) {
		super();
	}

	get creeps(): Creep[] {
		return this._creeps;
	}

	get name(): string {
		return this._name;
	}

	serialize(): SerialRaw {
		let creeps: _.List<string> = _.map(this._creeps, (c)=>c.id);

		return {
			class: "Party",
			data: {
				name: this._name,
				creeps: creeps,
			}
		}
	}

	// unserialize(data: SerialRaw): this {
		
	// 	return this;
	// }

}