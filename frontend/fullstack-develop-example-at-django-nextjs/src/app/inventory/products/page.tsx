'use client'

import {
    Alert,
    AlertColor,
    Box,
    Button,
    IconButton,
    Paper,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";

import { useState, useEffect } from 'react'
import { useForm } from "react-hook-form";
import Link from 'next/link'
import axios from 'axios';

import proudctDatas from './sample/dummy_products.json'


interface ProductData {
    id: number | null;
    name: string;
    price: number;
    description: string;
}


export default function Page() {

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm()

    const [data, setData] = useState<Array<ProductData>>([])
    const [open, setOpen] = useState(false)
    const [severity, setSeverity] = useState<AlertColor>('success')
    const [message, setMessage] = useState('')

    const result = (severity: AlertColor, message: string) => {
        setOpen(true)
        setSeverity(severity)
        setMessage(message)
    }

    const handleClose = (event: any, reason: any) => {
        setOpen(false)
    }

    useEffect(() => {

        axios.get('/api/inventory/products/')
            .then((res) => res.data)
            .then((data) => {
                setData(data)
            })
    }, [open])

    const [id, setId] = useState<number | null>(0)

    // submit時のactionを分岐させる
    const [action, setAction] = useState<string>("");

    const onSubmit = (event: any): void => {
        
        const data: ProductData = {
            id: id,
            name: event.name,
            price: Number(event.price),
            description: event.description,
        }

        // actionによってHTTPメソッドと使用するパラメーターを切り替える
        if (action === 'add') {

            handleAdd(data)

        } else if (action === 'update') {

            if (data.id === null) {
                return
            }

            handleEdit(data)

        } else if (action === 'delete') {

            if (data.id === null) {
                return
            } 

            handleDelete(data.id);

        }

    }

    // 状態を監視する対象の変数
    // const [shownNewRow, setShownNewRow] = useState(false)

    // 商品を追加する : onClickで発火するイベント
    const handleShowNewRow = () => {
        setId(null)
        reset({
            name: '',
            price: 0,
            description: '',
        })
    }

    // キャンセルする : onClickで発火するイベント
    const handleAddCancel = () => {
        setId(0)
    }

    // .. shownNewRow を false にする
    const handleAdd = (data: ProductData) => {
        result('success', '商品が登録されました')
        setId(0)
    }

    // 更新・削除処理、更新・削除行の表示状態を保持
    const handleEditRow = (id: number | null) => {

        const selectedProduct: ProductData = data.find(
            (v) => v.id === id
        ) as ProductData

        setId(selectedProduct.id)

        reset({
            name: selectedProduct.name,
            price: selectedProduct.price,
            description: selectedProduct.description,
        })
    }

    const handleEditCancel = () => {
        setId(0)
    }

    const handleEdit = (data: ProductData) => {
        result('success', '商品が更新されました')
        setId(0)
    }

    const handleDelete = (id: number) => {
        result('success', '商品が削除されました')
        setId(0)
    }

    return (
        <>
            <Snackbar open={open} autoHideDuration={3000} onClose={handleClose}>
                <Alert severity={severity}>{message}</Alert>
            </Snackbar>
            <Typography variant="h5">商品一覧</Typography>
            <Button
                variant="contained"
                onClick={() => handleShowNewRow()}
            >
                商品を追加する
            </Button>
            <Box
                component="form"
                onSubmit={handleSubmit(onSubmit)}
                sx={{ height: 400, width: "100%" }}
            >
                <table>
                    <thead>
                        <tr>
                            <th>商品ID</th>
                            <th>商品名</th>
                            <th>単価</th>
                            <th>説明</th>
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {id === null ? (
                        <tr>
                            <td></td>
                            <td>
                                <input type="text" id="name" {...register(
                                    'name', 
                                    {
                                        required: '必須項目です。',
                                        maxLength: {
                                            value: 100,
                                            message: '商品名は100文字以下で入力して下さい。'
                                        },
                                    })
                                } 
                                />
                                {errors.name && ( <div>{ errors.name.message }</div> )}
                            </td>
                            <td>
                                <input type="number" id="price" {...register('price', {required: true, min: 1, max: 99999999, })} />
                                {errors.price && ( <div>1から99999999の数値をを入力してください。</div> )}
                            </td>
                            <td>
                                <input type="text" id="description"  {...register('description')} />
                            </td>
                            <td></td>
                            <td>
                                <button type='submit' onClick={ () => handleAddCancel() }>キャンセルする</button>
                                <button type='submit' onClick={ () => setAction("add") }>追加する</button>
                            </td>
                        </tr>
                        ):(
                            ""
                        )}
                        {data.map((data: ProductData) => 
                            id === data.id ? (
                                <tr key={data.id}>
                                    <td>{data.id}</td>
                                    <td>
                                        <input type="text" id="name" {...register(
                                            'name', 
                                            {
                                                required: '必須項目です。',
                                                maxLength: {
                                                    value: 100,
                                                    message: '商品名は100文字以下で入力して下さい。'
                                                },
                                            })
                                        } 
                                        />
                                        {errors.name && ( <div>{ errors.name.message }</div> )}
                                    </td>
                                    <td>
                                        <input type="number" id="price" {...register('price', {required: true, min: 1, max: 99999999, })} />
                                        {errors.price && ( <div>1から99999999の数値をを入力してください。</div> )}
                                    </td>
                                    <td>
                                        <input type="text" id="description"  {...register('description')} />
                                    </td>
                                    <td></td>
                                    <td>
                                        <button type='button' onClick={ () => handleEditCancel() }>キャンセルする</button>
                                        <button type='submit' onClick={ () => setAction('update') }>更新する</button>
                                        <button type='submit' onClick={ () => setAction('delete') }>削除する</button>
                                    </td>
                                </tr>
                            ) : (
                                <tr key={data.id}>
                                    <td>{data.id}</td>
                                    <td>{data.name}</td>
                                    <td>{data.price}</td>
                                    <td>{data.description}</td>
                                    <td>
                                        <Link href={`/inventory/products/${data.id}`}>在庫処理</Link>
                                    </td>
                                    <td>
                                        <button onClick={ () => handleEditRow(data.id) }>更新・削除</button>
                                    </td>
                                </tr>   
                            )
                        )}
                    </tbody>
                </table>
            </Box>
        </>
    )
}