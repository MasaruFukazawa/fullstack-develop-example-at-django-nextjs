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

import proudctData from '../sample/dummy_products.json'
import inventoriesData from '../sample/dummy_inventories.json'
import { Console } from "console";

interface ProductData {
    id: number;
    name: string;
    price: number;
    description: string;
}

interface InventoryData {
    id: number;
    type: string;
    date: string;
    unit: number;  
    quantity: number;
    price: number;
    inventory: number;
}

export default function Page({params}: {params: { id: number },}) {

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm()
    
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

    // useEffect内で変わる変数
    const [product, setProduct] = useState<ProductData>({
        id: 0,
        name: '',
        price: 0,
        description: "",
    })

    const [data, setData] = useState<Array<InventoryData>>([]);

    useEffect(() => {

        axios
            .get(`/api/inventory/products/${params.id}`)
            .then((res) => {
                setProduct(res.data)
            })
        
        axios.get(`/api/inventory/inventories/${params.id}`)
            .then((res) => {
                const inventoryData: InventoryData[] = [];

                let key: number = 1;
                let inventory: number = 0;

                res.data.forEach((e: InventoryData) => {
                    inventory += e.type === 1 ? e.quantity : e.quantity * -1

                    const newElement = {
                        id: key++,
                        type: e.type,
                        date: e.date,
                        unit: e.unit,
                        quantity: e.quantity,
                        price: e.unit * e.quantity,
                        inventory: inventory,
                    }
                    inventoryData.unshift(newElement);
                })

                setData(inventoryData);
            })

    }, [open])

    // submit時のactionを分岐させる
    const [action, setAction] = useState<string>("");

    // 追加登録
    const onSubmit = (event: any): void => {
    }

    // 仕入れ・卸し処理
    const handlePurchase = (data: FormData) => {
        result('success', '商品を仕入れました')
    };

    const handleSell = (data: FormData) => {
        result('success', '商品を卸しました')
    };

    return (
        <>
            <Snackbar open={open} autoHideDuration={3000} onClose={handleClose}>
                <Alert severity={severity}>{message}</Alert>
            </Snackbar>
            <Typography variant="h5">商品在庫管理</Typography>
            <Typography variant="h6">在庫処理</Typography>
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <div>
                    <label>商品名:</label>
                    <span>{product.name}</span>
                </div>
                <div>
                    <label>数量:</label>
                    <input type="text" />
                </div>
                <Button
                    variant="contained"
                    type="submit"
                    onClick={() => setAction("purchase")}
                >
                    商品を仕入れる
                </Button>
                <Button
                    variant="contained"
                    type="submit"
                    onClick={() => setAction("sell")}
                >
                    商品を卸す
                </Button>
            </Box>
            <h3>在庫履歴</h3>
            <table>
                <thead>
                    <tr>
                        <th>処理種別</th>
                        <th>処理日時</th>
                        <th>単価</th>
                        <th>数量</th>
                        <th>価格</th>
                        <th>在庫数</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((data: InventoryData) => (
                    <tr key={data.id}>
                        <td>{data.type}</td>
                        <td>{data.date}</td>
                        <td>{data.unit}</td>
                        <td>{data.quantity}</td>
                        <td>{data.price}</td>
                        <td>{data.inventory}</td>
                    </tr>
                    ))}
                </tbody>
            </table>
        </>
    )

}