<!-- target: TPL_list_buckets -->
<!-- for: ${rows} as ${row} -->
<tr>
    <!-- if: ${row.is_dir} -->
    <td><a href="#/${row.name}">${row.name}/</a></td>
    <!-- else -->
    <td>${row.name}</td>
    <!-- /if -->
    <td>&nbsp;</td>
    <td>文件夹</td>
    <td>-</td>
    <td>${row.creationDate|relativeTime}</td>
</tr>
<!-- /for -->
