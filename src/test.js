function start(){
    let randomNumber = Math.floor(Math.random()*10)
    let randomNumberPlaceHolder=randomNumber
    for(var i=0;i<10;i++){
        console.log("randomNumber: ",randomNumber)
        randomNumber -= i;
        console.log("i: ",i)
        if(randomNumber<0){
            let newRandomNumber = Math.floor(Math.random()*2)
            if(newRandomNumber==0){
                console.log("newrandomnumber is 0")
                i=-1;
                randomNumber = randomNumberPlaceHolder
            }else{
                console.log("newrandomnumber is NOT 0")
                return "number smaller than zero, i: " + i + ", randomNumberPlaceHoder:" + randomNumberPlaceHolder
            }
        }
    }
}

console.log(start());