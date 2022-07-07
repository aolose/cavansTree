# cavansTree
draw the  tree  on canvas


### usage

```js
import {canvasTree} from "./cavansTree/index.js";


const app = document.querySelector('#app')
const tree = {
    name: '总裁办',
    level: 0,
    children: [
        {name: '技术师', level: 1},
        {name: '前端开发一部', level: 2},
        {
            name: '前端开发二部', level: 2, children: [
                {name: '前端开发3-1部', level: 3},
            ]
        },
        {
            name: '前端开发三部', level: 2, children: [
                {name: '前端开发4-0部', level: 3},
                {name: '前端开发4-0部', level: 3},
            ]
        },
    ]
}

canvasTree(app).load(tree)
```

![image](https://user-images.githubusercontent.com/7620293/177822526-e88d793a-3f2b-4378-92de-3623c97c0e79.png)



