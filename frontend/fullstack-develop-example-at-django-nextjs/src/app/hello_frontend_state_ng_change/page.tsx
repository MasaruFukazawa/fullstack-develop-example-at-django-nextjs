'use client';

import { useEffect, useState } from 'react';

export default function Page() {

    // オブジェクトを状態管理する
    let [data, setData] = useState({name: '初期値'})

    // レンダリングあとに1度だけ上書きする
    useEffect(() => {
        setData({name: '変更'})
    }, [])

    return <div>hello {data.name} !</div>
}