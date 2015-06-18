<!-- target: TPL_list_objects -->
<!-- if: ${contents.length} <= 0 && (!${commonPrefixes} || ${commonPrefixes.length} <= 0) -->
    <tr><td colspan="5" class="no-content">暂无内容.</td></tr>
<!-- else -->
    <!-- for: ${contents} as ${row} -->
    <!-- if: ${row.key} -->
    <tr>
        <td><a target="_blank" href="/v1/${name}/${prefix|raw}${row.key}">${row.key}</a></td>
        <td>
            <i class="fa fa-trash-o" title="删除" data-bucket="${name}" data-key="${prefix|raw}${row.key}"></i>
            <a class="fa" href="/v1/${name}/${prefix|raw}${row.key}?responseContentDisposition=attachment"><i class="fa fa-download" title="下载"></i></a>
        </td>
        <td>文件</td>
        <td>${*row.size|filesize}</td>
        <td>${row.lastModified|relativeTime}</td>
    </tr>
    <!-- /if -->
    <!-- /for -->
    <!-- for: ${commonPrefixes} as ${row} -->
    <tr>
        <td><a href="#/${name}/${prefix|raw}${row.prefix}">${row.prefix}</a></td>
        <td>&nbsp;</td>
        <td>文件夹</td>
        <td>-</td>
        <td>-</td>
    </tr>
    <!-- /for -->
<!-- /if -->
