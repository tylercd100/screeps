/*
* @Author: Tyler Arbon
* @Date:   2017-08-09 18:05:37
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-09 18:28:16
*/

'use strict';

export interface SerialRaw {
	class: string;
	data: _.Dictionary<string|number|boolean|_.List<string|number|boolean>>;
}

export abstract class Serializable {
	abstract serialize(): SerialRaw;
	abstract unserialize<T>(data: SerialRaw): T;
}