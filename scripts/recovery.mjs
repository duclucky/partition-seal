import {runPayments} from './payments.mjs';
import {reportError} from './network.mjs';
runPayments('expiry').catch(reportError);
