<!-- target: TPL_list_bcs_objects -->
<!-- var: contents = ${object_list}; -->
<!-- if: ${contents.length} <= 0 && (!${commonPrefixes} || ${commonPrefixes.length} <= 0) -->
    <tr><td colspan="5" class="no-content">暂无内容.</td></tr>
<!-- else -->
    <!-- for: ${contents} as ${row} -->
    <!-- if: ${row.is_dir} == "0" -->
    <tr>
        <td><i class="fa ${row.object|fa_icon}"></i> <a target="_blank" href="/${bucket}${prefix|raw}${row.object}">${row.object}</a></td>
        <td>
            <i class="fa fa-trash-o" title="删除" data-bucket="${bucket}" data-key="${prefix|raw}${row.object}"></i>
            <a class="fa" href="/${bucket}${prefix|raw}${row.key}?responseContentDisposition=attachment"><i class="fa fa-download" title="下载"></i></a>
        </td>
        <td>文件</td>
        <td>${*row.size|filesize}</td>
        <td>${row.mdatetime|relativeTime(true)}</td>
    </tr>
    <!-- /if -->
    <!-- /for -->
    <!-- for: ${commonPrefixes} as ${row} -->
    <tr>
        <td><i class="fa fa-folder-o"></i> <a href="#/${bucket}${prefix|raw}${row.prefix}">${row.prefix}</a></td>
        <td>&nbsp;</td>
        <td>文件夹</td>
        <td>-</td>
        <td>-</td>
    </tr>
    <!-- /for -->
<!-- /if -->
