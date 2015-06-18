<!-- target: TPL_list_buckets -->
<!-- for: ${rows} as ${row} -->
<tr>
    <!-- if: ${row.is_dir} -->
    <td><i class="fa fa-folder-o"></i> <a href="#/${row.name}">${row.name|i18n}/</a></td>
    <!-- else -->
    <td><i class="fa ${row.name|fa_icon}"></i> ${row.name}</td>
    <!-- /if -->
    <td>&nbsp;</td>
    <td>文件夹</td>
    <td>-</td>
    <td>${row.creationDate|relativeTime}</td>
</tr>
<!-- /for -->
