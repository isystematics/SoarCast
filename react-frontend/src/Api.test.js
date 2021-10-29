
import { API } from "Api";
beforeEach(async ()=>{
    const loginCreds = {
        username: "",
        password: ""
    }
    //API.url = "https://api.test.io";
    try{
        let response = await API.login.tokenCreate(loginCreds);
        API.token = response.data.token;
    }catch(error){
        console.warn('Missing Login Information');
        return;
    }
});
it("Gets masters list", async () => {
    let result;
    try{
        result = await API.masters.list();
    }catch(error){
        console.warn(error.response);
    }
    expect(result.data.results.length).toBeGreaterThan(0);
});
it("Gets notifications list", async () => {
    let result;
    try{
        result = await API.notification.list();
    }catch(error){
        console.warn(error.response);
    }
    expect(result.data.results.length).toBeGreaterThan(0);
});
it("Gets run statuses list", async () => {
    let result;
    try{
        result = await API.runners.runStatuses();
    }catch(error){
        console.warn(error.response);
    }
    expect(result.data.results.length).toBeGreaterThan(0);
});
it("Gets runners list", async () => {
    let result;
    try{
        result = await API.runners.list();
    }catch(error){
        console.warn(error.response);
    }
    expect(result.data.results.length).toBeGreaterThan(0);
});
it("Sets token", async () => {
    let fakeResult = 'Bearer testToken';
    API.token = fakeResult;
    let testToken = sessionStorage.getItem('token');
    expect(testToken).toBe('Bearer testToken');
});