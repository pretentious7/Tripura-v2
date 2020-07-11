import {Machine, send, assign, sendParent, actions} from 'xstate';
const {log} = actions;
import { transactionID }  from './globals.js';
import { db, functions, auth } from './firebase_setup.js';

const createTransactionAccountPatient =
	functions.httpsCallable('authorization-createTransactionAccountPatient');

const userPromise = new Promise((resolve, reject) => {
	auth.onAuthStateChanged((user) => {
		if(user){
			resolve(user);
		} else {
			reject("no user logged in");
		}
	})
});
const authorizationMachine = Machine({
	id : 'authorizationMachine',
	initial : 'pending',
	states : {
		'pending' : {
			//choose logged in or no logged in
			invoke : {
				id : 'loginPromise',
				src : userPromise,
				onDone : {
					target : 'authorized'
				},
				onError : {
					target : 'loading'
				}
			}
		},
		'loading' : {
			invoke : {
				id : 'createToken',
				src : createTransactionAccountPatient({uid : transactionID}),
				onDone : {
					target : 'authorized',
					actions : log('logged in')
				},
				onError : {
				}
			}
			//if no logged in, create token and return to pending
		},
		'authorized' : {
			type : 'final',
			entry : sendParent('DONE')
		}
	}
},{})

export { authorizationMachine };
