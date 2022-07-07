
export function canvasTree(target = document.body) {
    const fontSize = 13
    const padding = 5
    const nodeMargin = 20
    const canvasPadding = 20
    const nodeHeight = fontSize + padding * 2
    const levelHeight = nodeHeight*3
// detect event on nodes
    const nodes = []
    let ctx
    const initCanvas = () => {
        const canvas = document.createElement('canvas')
        canvas.style.background = '#f2f2f2'
        const cx = [Infinity, 0]
        const cy = [Infinity, 0]
        canvas.addEventListener('mousemove', (e) => {
            const {offsetX, offsetY} = e
            nodes.forEach(fn => fn(offsetX, offsetY))
        });
        walkNode(a => {
            if (a.draw) {
                const {x, y} = a
                if (x[0] < cx[0]) cx[0] = x[0]
                if (x[1] > cx[1]) cx[1] = x[1]
                if (y[0] < cy[0]) cy[0] = y[0]
                if (y[1] > cy[1]) cy[1] = y[1]
            }
        })
        canvas.width = cx[1] - cx[0] + canvasPadding * 2
        canvas.height = cy[1] - cy[0] + canvasPadding * 2
        target.appendChild(canvas)
        const fx = -cx[0]
        if (fx) {
            walkNode(n => movePos(n, fx + canvasPadding, canvasPadding))
        }
        ctx = canvas.getContext('2d')
        ctx.fontSize = fontSize
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
    }

// move target
    const movePos = ({x: px = [], y: py = []}, x, y) => {
        px.forEach((a, i) => px[i] = a + x)
        py.forEach((a, i) => py[i] = a + y)
    }
    const moveGroupPos = (g) => {
        if (g) {
            const [{x: [a, b = a]}, , ...arr] = g
            const x0 = arr[0].x[0]
            const xx = arr[arr.length - 1].x
            const x1 = xx[1] || xx[0]
            const x = (a + b) / 2 - (x0 + x1) / 2
            arr.forEach(a => {
                movePos(a, x, 0)
                moveGroupPos(a.g)
            })
        }
    }


// create point
    const point = (level = 0) => {
        return {
            l: level,
            g: null, // the group which point to the point
            x: [0],
            y: [0],
            line({y, x, w}) {
                console.log('point', this.x, this.y)
                ctx.moveTo(this.x[0], this.y[0])
                const [a, b] = y
                if (isNaN(b)) {
                    ctx.lineTo(this.x[0], a)
                } else {
                    const fy = this.y[0] - levelHeight / 2 + nodeHeight / 2
                    const fx = x[0] + w / 2
                    ctx.lineTo(this.x[0], fy)
                    ctx.lineTo(fx, fy)
                    ctx.lineTo(fx, b)
                }
            }
        }
    }

// create text node
    const node = (str, level = 0) => {
        const l = str.length
        const w = l * fontSize + padding * 2
        const h = nodeHeight
        const px = [0, w]
        const py = [0, h]
        let act = 0
        nodes.push((x, y) => {
            const a = x > px[0] && x < px[1] && y > py[0] && y < py[1]
            if (a !== act) {
                act = a
                // todo redraw
            }
        });

        return {
            s: str,
            g: null,  // the group which point to the node
            f: 0,     // position fixed
            w,        // node width
            x: px,    // x positions
            y: py,    // y positions
            v: level,
            draw(parent) {
                ctx.moveTo(px[0], py[0])
                ctx.lineTo(px[1], py[0])
                ctx.lineTo(px[1], py[1])
                ctx.lineTo(px[0], py[1])
                ctx.lineTo(px[0], py[0])
                const mx = px[0] + w / 2
                ctx.fillText(str, mx, py[0] + h / 2, fontSize * str.length)
                if (parent) {
                    const {x, y} = parent
                    const [a, b] = x, [c, d] = y
                    ctx.moveTo(mx, py[0])
                    let my = py[0] - levelHeight / 2
                    if (!isNaN(d)) {
                        const tx = a + (b - a) / 2
                        my = my + nodeHeight / 2
                        ctx.lineTo(mx, my)
                        ctx.lineTo(tx, my)
                        ctx.lineTo(tx, d)
                    } else {
                        ctx.lineTo(mx, my)
                        ctx.lineTo(a, my)
                        ctx.lineTo(a, c)
                    }
                }
            }
        }
    }

// group schema:  [parent,width,...nodes|points]
// if there are levels between parent and current node, create point between them.
    const fillPoints = (group) => {
        const [parent, , {v: l1}] = group
        if (parent) {
            const {v: l0} = parent
            let c = l1 - l0
            let p = parent
            while (c-- > 1) {
                p = addToLv(point(), p, l1 - c)
            }
            group[0] = p
            p.g = group
        }
    }

// group nodes if they have same level and parent.
    const addToLv = (n, p, l) => {
        if (!lvsMap[l]) {
            lvs.push(l)
            lvsMap[l] = []
        }
        const curLv = lvsMap[l]
        let group = curLv.find(a => a[0] === p)
        if (!group) curLv.push(group = [p, 0])
        group.push(n)
        return n
    }

    const walkGroup = (fn) => {
        let l = lvs.length
        while (l--) {
            const lv = lvs[l]
            fn(lvsMap[lv], lv)
        }
    }
    const walkNode = (fn) => {
        walkGroup(gs => gs.forEach(([, , ...ns]) => {
            ns.forEach(fn)
        }))
    }


// you already have the formatted tree
// now you should calculate the coordinates of each node and point.
    const fixPosition = () => {
        let beforeX = 0
        const distanceN = []
        const distance = []
        walkGroup((groups, lv) => {
            const dn = []
            const ds = []
            groups.forEach((group = []) => {
                let gw = 0
                const h = lv * levelHeight
                dn.push(group[0])
                group.slice(2).forEach((node) => {
                    let margin = nodeMargin
                    const idx = distanceN.indexOf(node)
                    if (idx > -1) {
                        margin = distance[idx]
                    }
                    const {x, y, w = 0, g} = node
                    const px = beforeX - x[0]
                    movePos({x, y}, px, h - y[0])
                    moveGroupPos(g)
                    const ww = w + margin
                    beforeX += ww
                    gw += ww
                });
                if (gw) gw -= nodeMargin
                ds.push(group[1] = gw)
            })
            distanceN.length = distance.length = 0
            distanceN.push(...dn.slice(0, -1))
            if (distanceN.length) {
                ds.slice(1).forEach((a, i) => {
                    distance.push((a + ds[i]) / 2)
                })
            }
        })
    }

    const draw = () => {
        initCanvas()
        walkGroup(gs => gs.forEach(([p, , ...ns]) => {
            ns.forEach(n => {
                if (n.draw) {
                    n.draw(p)
                } else n.line(p)
            })
        }))
        ctx.stroke()
    }

// levels e.g [1,2,3,4]
    const lvs = []
// Map<level,group[]>
    const lvsMap = {}
    return {
        load(data) {
            const parse = ({name, level, children}, parent) => {
                const n = node(name, level)
                addToLv(n, parent, level)
                if (children && children.length) {
                    children.forEach(c => parse(c, n))
                }
            }
            parse(data, null)
            lvs.sort((a, b) => a > b ? 1 : -1)
            walkGroup(gs => gs.forEach(fillPoints))
            fixPosition()
            draw()
        }
    }
}
