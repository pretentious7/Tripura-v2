console.log('begin');
import Vue from 'vue/dist/vue.js';
import { Machine, interpret, send, assign, actions, forwardTo} from 'xstate';
import { authorizationMachine } from './utilityMachines.js';
import { db, functions } from './firebaseSetup.js';

const displayVue = new Vue({
	el : "#deetForm",
	data : {
		'doctorName' : 
	}
});

const siteMachine = Machine({
	id : 'siteMachine',
	initial : 'loading',
	context : {},
	states : {
		'loading' : {
			entry : assign({
				'authUser' : () => spawn(authorizationMachine)
			}),
			on : {
				'DONE' : 'fillVue'
			}
		},
		'fillVue' : {

	}
},{
});





