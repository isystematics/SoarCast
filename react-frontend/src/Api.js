import axios from 'axios'
class Api {
    defaultVersion = 'v1';
    _token;
    get token() {
        if(this._token == undefined){
            this._token = sessionStorage.getItem('token');
        }
        return this._token;
    }
    set token(value) {
        this._token = value;
        sessionStorage.setItem('token', value);
    }
    constructor(){
    } 
    masters = {
        list: () => this.get('saltmaster/list'),
        updateMinions: (master) => this.post(`saltmaster/${master.id}/update-minions`),
        redisKey: (key) => this.get(`saltmaster/redis/${key}`),
        syncModules: () => this.post(`saltmaster/repo/sync-modules`),
        syncMinion: (minionPk) => this.post(`saltmaster/repo/sync-modules/${minionPk}`),
        reposList: (params) => this.get('saltmaster/repo', params),
        reposAdd: (data) => this.post('saltmaster/repo', data),
        reposEdit: (id, data) => this.put(`saltmaster/repo/${id}`, data),
        reposDelete:  (id) => this.delete(`saltmaster/repo/${id}`)
    }
    minions = {
        keys: (keys) => this.post('saltmaster/minions/keys', keys),
        list: (params) => this.get('saltmaster/minions', params),
    }
    notification = {
        list: (params) => this.get('notification/list', params),
        markAsRead: (ids) => this.post('notification/mark-as-read', ids),
    }
    runners = {
        list: (params) => this.get('runners', params),
        execute: (id) => this.post(`runner/execute/${id}`),
        add: (data) => this.post('runners', data),
        edit: (id, data) => this.put(`runner/${id}`, data),
        delete:  (id) => this.delete(`runner/${id}`)
    }
    mappings = {
        list: (params) => this.get('mappings', params),
        add: (data) => this.post('mappings', data),
        edit: (id, data) => this.put(`mapping/${id}`, data),
        delete:  (id) => this.delete(`mapping/${id}`)
    }
    modules = {
        list: (params) => this.get('modules', params)
    }
    auditEntries = {
        list: (params) => this.get(`audit-entries`, params),
    }
    variableSets = {
        listAll: (page) => this.get('variable-sets', page),
        list: (id) => this.get(`variable-set/${id}`),
        add: (data) => this.post('variable-sets', data),
        edit: (id, data) => this.put(`variable-set/${id}`, data),
        delete:  (id) => this.delete(`variable-set/${id}`) 
    }
    variables = {
        list: (params) => this.get(`variables`, params),
        add: (data) => this.post('variables', data),
        edit: (id, data) => this.put(`variable/${id}`, data),
        delete:  (id) => this.delete(`variable/${id}`) 
    }
    redisSettings = {
        list: () => this.get('redis-settings'),
        add: (data) => this.post('redis-settings', data),
        edit: (id, data) => this.put(`redis-setting/${id}`, data),
        delete: (id) => this.delete(`redis-setting/${id}`),
    }
    playbooks = {
        list: (params) => this.get('playbooks', params),
        add: (data) => this.post('playbooks', data),
        edit: (id, data) => this.put(`playbook/${id}`, data),
        execute: (id) => this.post(`playbook/execute/${id}`),
        delete:  (id) => this.delete(`playbook/${id}`) 
    }
    mapItems = {
        list: (params) => this.get('map-items', params),
        edit: (id, data) => this.put(`map-item/${id}`, data),
    }
    playbookMappings = {
        list: (params) => this.get(`playbook-mappings`, params),
        //list: (id, params) => this.get(`playbook-mapping/${id}`, params),
        edit: (id, data) => this.put(`playbook-mapping/${id}`, data),
    }
    playbookItems = {
        list: (params) => this.get(`playbook-items`, params),
        //list: (id, params) => this.get(`playbook-item/${id}`, params),
        edit: (id, data) => this.put(`playbook-item/${id}`, data),
    }
    conditions = {
        listAll: (params) => this.get('conditions', params),
        list: (id, params) => this.get(`condition/${id}`, params),
        add: (data) => this.post('conditions', data),
        edit: (id, data) => this.put(`condition/${id}`, data),
        delete:  (id) => this.delete(`condition/${id}`)
    }
    conditionVariables = {
        detail: (id) => this.get(`condition-variable/${id}`),
        list: () => this.get(`condition-variables`),
        add: (data) => this.post('condition-variables', data),
        edit: (id, data) => this.put(`condition-variable/${id}`, data),
        delete:  (id) => this.delete(`condition-variable/${id}`)
    }
    functionVariables = {
        list: (params) => this.get(`expected-variables`, params)
    }
    appGroups = {
        list: (params) => this.get('app-groups', params)
    }
    requestSecrets = {
        post: (data) => this.post(`request-secrets`, data),
        hashUrlList: (id, params) => this.get(`request-secrets/${id}`, params),
        storeSecrets: (id, data) => this.put(`request-secrets/${id}`, data),
    }
    apps = {
        list: (params) => this.get('apps', params),
        add: (data) => this.post('apps', data),
        edit: (id, data) => this.put(`app/${id}`, data),
        delete: (id) => this.delete(`app/${id}`)
    }
    login = {
        tokenCreate: (loginCredentials) => this.post('token/create', loginCredentials),
    }
    app_users = {
        list: (params) => this.get('app-users', params),
        add: (data) => this.post('app-users', data),
        edit: (id, data) => this.put(`app-user/${id}`, data),
        delete: (id) => this.delete(`app-user/${id}`),
        refreshToken: (id) => this.post(`app-user/${id}/refresh-token`)
    }
    app_groups = {
        list: (params) => this.get('app-groups', params),
        add: (data) => this.post('app-groups', data),
        edit: (id, data) => this.put(`app-group/${id}`, data),
        delete: (id) => this.delete(`app-group/${id}`)
    }
    runStatuses = {
        list: (params) => this.get('run-statuses', params),
        delete: (id) => this.delete(`run-status/${id}`),
    }
    playbookExecutions = {
        list: (params) => this.get('executions', params),
        delete: (id) => this.delete(`execution/${id}`),
    }
    emailSettings = {
        list: () => this.get('email-settings'),
        add: (data) => this.post('email-settings', data),
        edit: (id, data) => this.put(`email-setting/${id}`, data),
        delete: (id) => this.delete(`email-setting/${id}`),
    }
    saltmasterSettings = {
        list: () => this.get('saltmaster/list'),
        add: (data) => this.post('saltmaster/list', data),
        edit: (id, data) => this.put(`saltmaster/${id}`, data),
        delete: (id) => this.delete(`saltmaster/${id}`),

    }
    users = {
        list: () => this.get('users'),
    }
    headers = () => {
        return {
            Authorization: `Bearer ${this.token}`,
        }
    }
    async get(path, params, version){
        return await axios.get(`/api/${version || this.defaultVersion}/${path}/`, {
            params: params,
            headers: this.headers()
        });
    }
    async post(path, data, version){
        return await axios.post(`/api/${version || this.defaultVersion}/${path}/`, data, {headers:this.headers()});
    }
    async put(path, data, version){
        return await axios.put(`/api/${version || this.defaultVersion}/${path}/`, data, {headers:this.headers()});
    }
    async delete(path, data, version){
        return await axios.delete(`/api/${version || this.defaultVersion}/${path}/`, {headers:this.headers()});
    }
}
export const API = new Api();
