import { h } from 'hyperapp'
import './index.css'

const component = ({ row = 1 }) => (
  <div style={{
    height: `${row * 1.25}rem`,
    display: 'block',
    width: '100%'
  }} />
)

export default component
