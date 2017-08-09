/*
* @Author: Tyler Arbon
* @Date:   2017-08-08 19:14:27
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-08 19:14:36
*/

'use strict';

interface Creep {
	sayHello(): void;
}

Creep.prototype.sayHello = () => {
	this.say("hello");
}